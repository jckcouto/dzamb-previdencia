import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { storage } from "../storage";
import { insertPlanejamentoSchema, insertDocumentoPlanejamentoSchema } from "@shared/schema";
import { 
  processUploadedFiles, 
  convertPDFToBase64,
  downloadFileFromStorage,
  FileUploadError 
} from "../services/fileUpload";
import { gerarResumoPDF } from "../services/pdf-generator";
import { 
  extrairDadosDeDocumentos, 
  gerarParecerPrevidenciario,
  analisarAtaReuniao,
  importarCalculoExterno,
  gerarResumoExecutivo,
  getAvailableProviders,
  getDefaultProvider,
  analisarCnisDetalhado,
  analisarDocumentoComparativo,
  analisarCompetencias,
  analisarCompetenciasTodosVinculos,
  detectarRemuneracoesProblematicas,
  validarIdentificacao,
  type VinculoExtraido,
  type AnaliseCompetenciasResult,
  type ProblemaRemuneracaoResult
} from "../services/ai";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"),
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF são permitidos"));
    }
  },
});

router.post("/upload", upload.array("documentos", 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ 
        error: "Nenhum arquivo enviado. Por favor, envie ao menos um documento PDF." 
      });
    }

    const { clienteNome, clienteCpf } = req.body;

    if (!clienteNome || !clienteCpf) {
      return res.status(400).json({ 
        error: "clienteNome e clienteCpf são obrigatórios" 
      });
    }

    const files = req.files.map((file: Express.Multer.File) => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    }));

    const uploadedFiles = await processUploadedFiles(files);

    const userId = "1";

    const planejamento = await storage.createPlanejamento({
      userId,
      clienteNome,
      clienteCpf,
      status: "uploaded",
    });

    let documentoCnisId: string | null = null;
    let documentoCnisUrl: string | null = null;

    for (const file of uploadedFiles) {
      // Detectar tipo de documento pelo nome do arquivo
      const nomeUpper = file.filename.toUpperCase();
      let tipoDocumento = "CNIS";
      if (nomeUpper.includes("CTPS")) tipoDocumento = "CTPS";
      else if (nomeUpper.includes("PPP")) tipoDocumento = "PPP";
      else if (nomeUpper.includes("FGTS")) tipoDocumento = "FGTS";
      else if (nomeUpper.includes("CNIS")) tipoDocumento = "CNIS";

      const documento = await storage.createDocumentoPlanejamento({
        planejamentoId: planejamento.id,
        nomeArquivo: file.filename,
        tipoDocumento,
        arquivoUrl: file.url,
      });

      // Detectar se é CNIS
      if (tipoDocumento === "CNIS") {
        documentoCnisId = documento.id;
        documentoCnisUrl = documento.arquivoUrl;
      }
    }

    // 🆕 ANÁLISE AUTOMÁTICA DO CNIS
    let cnisAnalisado = false;
    if (documentoCnisId && documentoCnisUrl) {
      console.log("[upload] CNIS detectado, iniciando análise automática...");
      
      try {
        // Baixar e converter para base64
        const fileBuffer = await downloadFileFromStorage(documentoCnisUrl);
        const pdfBase64 = convertPDFToBase64(fileBuffer);
        
        // Analisar CNIS com IA
        const analiseCnis = await analisarCnisDetalhado(pdfBase64);
        
        // Salvar identificação extraída
        if (analiseCnis.identificacao) {
          const identificacaoSalva = await storage.createIdentificacaoCnis({
            planejamentoId: planejamento.id,
            nomeCompleto: analiseCnis.identificacao.nomeCompleto || null,
            cpf: analiseCnis.identificacao.cpf || null,
            nomeMae: analiseCnis.identificacao.nomeMae || null,
            nits: analiseCnis.identificacao.nits || [],
            dataNascimento: analiseCnis.identificacao.dataNascimento || null,
            validada: false,
          });
          
          // Executar validação de identificação
          const validacaoResult = validarIdentificacao(
            analiseCnis.identificacao,
            planejamento.clienteNome,
            planejamento.clienteCpf
          );
          
          // Atualizar status de validação
          await storage.updateIdentificacaoCnis(identificacaoSalva.id, {
            validada: validacaoResult.tudoOk
          });
          
          // Salvar alertas de identificação
          for (const alerta of validacaoResult.alertas) {
            await storage.createAlertaIdentificacao({
              planejamentoId: planejamento.id,
              tipo: alerta.tipo,
              gravidade: alerta.gravidade,
              mensagem: alerta.mensagem,
            });
          }
        }
        
        // Salvar vínculos extraídos
        if (analiseCnis.vinculos && analiseCnis.vinculos.length > 0) {
          for (const vinculo of analiseCnis.vinculos) {
            await storage.createVinculoCnis({
              planejamentoId: planejamento.id,
              sequencia: vinculo.sequencia,
              nit: vinculo.nit || null,
              empregador: vinculo.empregador,
              cnpjCpf: vinculo.cnpjCpf || null,
              tipoVinculo: vinculo.tipoVinculo || null,
              dataInicio: vinculo.dataInicio || null,
              dataFim: vinculo.dataFim || null,
              ultimaRemuneracao: vinculo.ultimaRemuneracao || null,
              indicadores: vinculo.indicadores || [],
              observacoes: vinculo.observacoes || null,
              origemDocumento: "CNIS",
            });
          }
        }
        
        cnisAnalisado = true;
        console.log("[upload] ✅ Análise automática do CNIS concluída!");
      } catch (error) {
        console.error("[upload] ⚠️ Erro na análise automática do CNIS:", error);
        // NÃO FALHAR O UPLOAD - apenas logar o erro
        // Usuário pode tentar analisar manualmente depois
      }
    }

    return res.status(201).json({
      message: "Documentos enviados com sucesso",
      planejamentoId: planejamento.id,
      filesUploaded: uploadedFiles.length,
      cnisAnalisado, // 🆕 Novo campo
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    
    if (error instanceof FileUploadError) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ 
      error: "Erro ao processar upload. Tente novamente." 
    });
  }
});

router.get("/providers", async (_req: Request, res: Response) => {
  try {
    const available = getAvailableProviders();
    const defaultProvider = getDefaultProvider();
    
    return res.status(200).json({
      available,
      default: defaultProvider,
      configured: available.length > 0,
    });
  } catch (error) {
    console.error("Erro ao listar provedores:", error);
    return res.status(500).json({ error: "Erro ao listar provedores de IA" });
  }
});

router.post("/processar", async (req: Request, res: Response) => {
  try {
    const { planejamentoId, provider } = req.body;

    if (!planejamentoId) {
      return res.status(400).json({ error: "planejamentoId é obrigatório" });
    }

    const planejamento = await storage.getPlanejamento(planejamentoId);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    if (planejamento.status === "processed" || planejamento.status === "parecer_gerado") {
      return res.status(400).json({ 
        error: "Este planejamento já foi processado" 
      });
    }

    const documentos = await storage.getDocumentosPlanejamento(planejamentoId);

    if (documentos.length === 0) {
      return res.status(400).json({ 
        error: "Nenhum documento encontrado para processar" 
      });
    }

    await storage.updatePlanejamento(planejamentoId, {
      status: "processing",
    });

    try {
      const pdfBase64List: string[] = [];
      
      for (const doc of documentos) {
        try {
          const fileBuffer = await downloadFileFromStorage(doc.arquivoUrl);
          const base64 = convertPDFToBase64(fileBuffer);
          pdfBase64List.push(base64);
        } catch (error) {
          console.error(`Erro ao carregar documento ${doc.nomeArquivo}:`, error);
          throw new Error(`Falha ao carregar documento: ${doc.nomeArquivo}`);
        }
      }

      if (pdfBase64List.length === 0) {
        throw new Error("Nenhum documento válido encontrado para processar");
      }

      const dadosExtraidos = await extrairDadosDeDocumentos(pdfBase64List, provider);

      const dadosJson = JSON.stringify(dadosExtraidos);

      await storage.updatePlanejamento(planejamentoId, {
        dadosExtraidos: dadosJson,
        status: "processed",
      });

      return res.status(200).json({
        message: "Documentos processados com sucesso",
        dados: dadosExtraidos,
      });
    } catch (error) {
      await storage.updatePlanejamento(planejamentoId, {
        status: "error",
      });
      throw error;
    }
  } catch (error) {
    console.error("Erro ao processar documentos:", error);
    
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Erro ao processar documentos com IA" 
    });
  }
});

router.post("/gerar-parecer", async (req: Request, res: Response) => {
  try {
    const { planejamentoId, provider } = req.body;

    if (!planejamentoId) {
      return res.status(400).json({ error: "planejamentoId é obrigatório" });
    }

    const planejamento = await storage.getPlanejamento(planejamentoId);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    if (!planejamento.dadosExtraidos) {
      return res.status(400).json({ 
        error: "Documentos ainda não foram processados. Execute /processar primeiro." 
      });
    }

    if (planejamento.status === "parecer_gerado" && planejamento.parecerGerado) {
      return res.status(200).json({
        message: "Parecer já foi gerado anteriormente",
        parecer: planejamento.parecerGerado,
      });
    }

    const dados = JSON.parse(planejamento.dadosExtraidos);

    const contextoAdicional: { resumoAta?: string; dadosCalculoExterno?: any } = {};
    
    if (planejamento.resumoAta) {
      contextoAdicional.resumoAta = planejamento.resumoAta;
    }
    
    if (planejamento.dadosCalculoExterno) {
      contextoAdicional.dadosCalculoExterno = planejamento.dadosCalculoExterno;
    }

    const parecer = await gerarParecerPrevidenciario(
      dados, 
      provider, 
      Object.keys(contextoAdicional).length > 0 ? contextoAdicional : undefined
    );

    await storage.updatePlanejamento(planejamentoId, {
      parecerGerado: parecer,
      status: "parecer_gerado",
    });

    return res.status(200).json({
      message: "Parecer gerado com sucesso",
      parecer,
    });
  } catch (error) {
    console.error("Erro ao gerar parecer:", error);
    
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Erro ao gerar parecer com IA" 
    });
  }
});

router.post("/:id/analisar-ata", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { textoAta } = req.body;

    if (!textoAta) {
      return res.status(400).json({ error: "textoAta é obrigatório" });
    }

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const resumo = await analisarAtaReuniao(textoAta);

    await storage.updatePlanejamento(id, {
      resumoAta: resumo,
    });

    return res.status(200).json({
      message: "Ata analisada com sucesso",
      resumo,
    });
  } catch (error) {
    console.error("Erro ao analisar ata:", error);
    
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Erro ao analisar ata com IA" 
    });
  }
});

router.post("/:id/importar-calculo", upload.single("relatorio"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo PDF do relatório é obrigatório" });
    }

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const pdfBase64 = convertPDFToBase64(req.file.buffer);
    const dadosCalculo = await importarCalculoExterno(pdfBase64);

    await storage.updatePlanejamento(id, {
      dadosCalculoExterno: dadosCalculo,
    });

    return res.status(200).json({
      message: "Relatório de cálculo importado com sucesso",
      dados: dadosCalculo,
    });
  } catch (error) {
    console.error("Erro ao importar cálculo:", error);
    
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Erro ao importar cálculo externo" 
    });
  }
});

router.post("/:id/resumo-executivo", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    if (!planejamento.parecerGerado) {
      return res.status(400).json({ 
        error: "Parecer ainda não foi gerado. Gere o parecer primeiro." 
      });
    }

    const resumo = await gerarResumoExecutivo(planejamento.parecerGerado);

    await storage.updatePlanejamento(id, {
      resumoExecutivo: resumo,
    });

    return res.status(200).json({
      message: "Resumo executivo gerado com sucesso",
      resumo,
    });
  } catch (error) {
    console.error("Erro ao gerar resumo executivo:", error);
    
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Erro ao gerar resumo executivo" 
    });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const documentos = await storage.getDocumentosPlanejamento(id);

    return res.status(200).json({
      ...planejamento,
      documentos,
      dadosExtraidos: planejamento.dadosExtraidos 
        ? JSON.parse(planejamento.dadosExtraidos) 
        : null,
      resumoAta: planejamento.resumoAta,
      dadosCalculoExterno: planejamento.dadosCalculoExterno,
      resumoExecutivo: planejamento.resumoExecutivo,
    });
  } catch (error) {
    console.error("Erro ao buscar planejamento:", error);
    
    return res.status(500).json({ 
      error: "Erro ao buscar planejamento" 
    });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const planejamentos = await storage.getPlanejamentos();

    const planejamentosComDocumentos = await Promise.all(
      planejamentos.map(async (p: any) => {
        const documentos = await storage.getDocumentosPlanejamento(p.id);
        return {
          ...p,
          documentos,
          dadosExtraidos: p.dadosExtraidos ? JSON.parse(p.dadosExtraidos) : null,
        };
      })
    );

    return res.status(200).json(planejamentosComDocumentos);
  } catch (error) {
    console.error("Erro ao listar planejamentos:", error);
    
    return res.status(500).json({ 
      error: "Erro ao listar planejamentos" 
    });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { nomeCliente, cpfCliente } = req.body;

    if (!nomeCliente || !cpfCliente) {
      return res.status(400).json({ 
        error: "nomeCliente e cpfCliente são obrigatórios" 
      });
    }

    const planejamento = await storage.createPlanejamento({
      userId: "1",
      clienteNome: nomeCliente,
      clienteCpf: cpfCliente,
      status: "rascunho",
    });

    return res.status(201).json(planejamento);
  } catch (error) {
    console.error("Erro ao criar planejamento:", error);
    
    return res.status(500).json({ 
      error: "Erro ao criar planejamento" 
    });
  }
});

router.post("/:id/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipoDocumento } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo PDF é obrigatório" });
    }

    if (!tipoDocumento) {
      return res.status(400).json({ error: "tipoDocumento é obrigatório" });
    }

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const files = [{
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    }];

    const uploadedFiles = await processUploadedFiles(files);
    const uploadedFile = uploadedFiles[0];

    const documento = await storage.createDocumentoPlanejamento({
      planejamentoId: id,
      nomeArquivo: uploadedFile.filename,
      tipoDocumento,
      arquivoUrl: uploadedFile.url,
    });

    return res.status(201).json({
      message: "Documento enviado com sucesso",
      documento,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    
    if (error instanceof FileUploadError) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ 
      error: "Erro ao processar upload. Tente novamente." 
    });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dadosExtraidos, parecerGerado, clienteNome, clienteCpf } = req.body;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const updates: any = {};

    if (dadosExtraidos) {
      updates.dadosExtraidos = JSON.stringify(dadosExtraidos);
    }

    if (parecerGerado) {
      updates.parecerGerado = parecerGerado;
    }

    if (clienteNome !== undefined) {
      updates.clienteNome = clienteNome;
    }

    if (clienteCpf !== undefined) {
      updates.clienteCpf = clienteCpf;
    }

    const updated = await storage.updatePlanejamento(id, updates);

    // Se atualizou nome ou CPF, re-validar alertas de identificação
    if (clienteNome !== undefined || clienteCpf !== undefined) {
      const identificacao = await storage.getIdentificacaoCnis(id);
      if (identificacao) {
        // Limpar alertas antigos e pendências relacionadas
        await storage.deleteAlertasIdentificacaoByPlanejamento(id);
        await storage.deletePendenciasByTipo(id, "identificacao_divergente");
        
        // Re-executar validação
        const novoNome = clienteNome !== undefined ? clienteNome : planejamento.clienteNome;
        const novoCpf = clienteCpf !== undefined ? clienteCpf : planejamento.clienteCpf;
        
        // Validar CPF
        if (identificacao.cpf && novoCpf) {
          const cpfCnis = identificacao.cpf.replace(/\D/g, "");
          const cpfCadastrado = novoCpf.replace(/\D/g, "");
          if (cpfCnis !== cpfCadastrado) {
            await storage.createAlertaIdentificacao({
              planejamentoId: id,
              tipo: "cpf_divergente",
              gravidade: "alta",
              mensagem: `ATENÇÃO: CPF do CNIS (${identificacao.cpf}) difere do CPF cadastrado (${novoCpf}). Verificar se é o documento correto.`,
            });
            await storage.createPendencia({
              planejamentoId: id,
              tipo: "identificacao_divergente",
              titulo: "CPF divergente entre CNIS e cadastro",
              descricao: `O CPF extraído do CNIS (${identificacao.cpf}) não corresponde ao CPF cadastrado (${novoCpf}). Verificar se o documento é do cliente correto.`,
              prioridade: "alta",
              status: "pendente",
            });
          }
        }
        
        // Validar nome
        if (identificacao.nomeCompleto && novoNome) {
          const nomeCnisNorm = identificacao.nomeCompleto.toLowerCase().trim();
          const nomeCadastradoNorm = novoNome.toLowerCase().trim();
          if (nomeCnisNorm !== nomeCadastradoNorm) {
            await storage.createAlertaIdentificacao({
              planejamentoId: id,
              tipo: "nome_divergente",
              gravidade: "alta",
              mensagem: `ATENÇÃO: Nome do CNIS (${identificacao.nomeCompleto}) difere do nome cadastrado (${novoNome}). Confirmar se é a mesma pessoa.`,
            });
          }
        }
      }
    }

    return res.status(200).json({
      message: "Planejamento atualizado com sucesso",
      planejamento: updated,
    });
  } catch (error) {
    console.error("Erro ao atualizar planejamento:", error);
    
    return res.status(500).json({ 
      error: "Erro ao atualizar planejamento" 
    });
  }
});

router.post("/:id/analisar-cnis", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentoId } = req.body;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const documentos = await storage.getDocumentosPlanejamento(id);
    
    let documentoCnis = documentos.find(d => d.tipoDocumento === "CNIS");
    if (documentoId) {
      documentoCnis = documentos.find(d => d.id === documentoId);
    }

    if (!documentoCnis) {
      return res.status(400).json({ 
        error: "Nenhum documento CNIS encontrado. Faça upload de um CNIS primeiro." 
      });
    }

    const fileBuffer = await downloadFileFromStorage(documentoCnis.arquivoUrl);
    const pdfBase64 = convertPDFToBase64(fileBuffer);

    const analiseCnis = await analisarCnisDetalhado(pdfBase64);

    // Fase 3: Salvar identificação do CNIS e executar validação
    await storage.deleteIdentificacaoCnisByPlanejamento(id);
    await storage.deleteAlertasIdentificacaoByPlanejamento(id);
    await storage.deletePendenciasByTipo(id, "identificacao_divergente");
    await storage.deletePendenciasByTipo(id, "identificacao_ausente");
    
    let alertasIdentificacaoCount = 0;
    
    if (analiseCnis.identificacao) {
      const identificacaoSalva = await storage.createIdentificacaoCnis({
        planejamentoId: id,
        nomeCompleto: analiseCnis.identificacao.nomeCompleto || null,
        cpf: analiseCnis.identificacao.cpf || null,
        nomeMae: analiseCnis.identificacao.nomeMae || null,
        nits: analiseCnis.identificacao.nits || [],
        dataNascimento: analiseCnis.identificacao.dataNascimento || null,
        validada: false,
      });
      
      // Executar validação
      const validacaoResult = validarIdentificacao(
        analiseCnis.identificacao,
        planejamento.clienteNome,
        planejamento.clienteCpf
      );
      
      // Atualizar campo validada com base no resultado
      await storage.updateIdentificacaoCnis(identificacaoSalva.id, {
        validada: validacaoResult.tudoOk
      });
      
      // Salvar alertas de identificação
      for (const alerta of validacaoResult.alertas) {
        await storage.createAlertaIdentificacao({
          planejamentoId: id,
          tipo: alerta.tipo,
          gravidade: alerta.gravidade,
          mensagem: alerta.mensagem,
        });
        
        // Gerar pendência para alertas de alta gravidade
        if (alerta.gravidade === "alta") {
          await storage.createPendencia({
            planejamentoId: id,
            tipo: "identificacao_divergente",
            prioridade: "alta",
            titulo: alerta.tipo === "cpf_divergente" 
              ? "CPF divergente no CNIS"
              : "Nome divergente no CNIS",
            descricao: alerta.mensagem,
            status: "aberta",
          });
        }
        
        alertasIdentificacaoCount++;
      }
    } else {
      // Identificação não foi extraída - criar pendência
      await storage.createPendencia({
        planejamentoId: id,
        tipo: "identificacao_ausente",
        prioridade: "alta",
        titulo: "Dados de identificação não extraídos",
        descricao: "A IA não conseguiu extrair os dados de identificação do CNIS. Verifique se o documento está legível.",
        status: "aberta",
      });
      alertasIdentificacaoCount++;
    }

    // Delete previous vínculos, contribuições, and related data before creating new ones
    await storage.deleteProblemasRemuneracaoByPlanejamento(id);
    await storage.deleteVinculosCnisByPlanejamento(id);

    for (const vinculo of analiseCnis.vinculos) {
      const vinculoData = {
        planejamentoId: id,
        sequencia: vinculo.sequencia,
        nit: vinculo.nit || null,
        empregador: vinculo.empregador || `Vínculo ${vinculo.sequencia}`,
        cnpjCpf: vinculo.cnpjCpf || null,
        tipoVinculo: vinculo.tipoVinculo || null,
        dataInicio: vinculo.dataInicio || null,
        dataFim: vinculo.dataFim || null,
        ultimaRemuneracao: vinculo.ultimaRemuneracao || null,
        indicadores: vinculo.indicadores || [],
        observacoes: vinculo.observacoes || null,
        origemDocumento: vinculo.origemDocumento || "CNIS",
      };
      
      const vinculoCriado = await storage.createVinculoCnis(vinculoData);

      const contribuicoes = analiseCnis.contribuicoesPorVinculo[vinculo.sequencia] || [];
      for (const contrib of contribuicoes) {
        await storage.createContribuicaoCnis({
          vinculoId: vinculoCriado.id,
          competencia: contrib.competencia,
          remuneracao: contrib.remuneracao || null,
          indicadores: contrib.indicadores || [],
        });
      }
    }

    for (const alerta of analiseCnis.alertas) {
      await storage.createPendencia({
        planejamentoId: id,
        titulo: "Alerta do CNIS",
        descricao: alerta,
        tipo: "alerta_cnis",
        prioridade: "media",
        status: "aberta",
      });
    }

    // Run and save competency analysis automatically
    const vinculosSalvos = await storage.getVinculosCnis(id);
    
    // Delete previous analysis and related pendências for this planejamento
    await storage.deleteAnaliseCompetenciasByPlanejamento(id);
    await storage.deletePendenciasByTipo(id, "remuneracoes_faltantes");
    
    let analiseCompetenciasResults: AnaliseCompetenciasResult[] = [];
    
    for (const vinculo of vinculosSalvos) {
      const contribuicoes = await storage.getContribuicoesCnis(vinculo.id);
      
      const analiseResult = analisarCompetencias(
        {
          id: vinculo.id,
          sequencia: vinculo.sequencia,
          empregador: vinculo.empregador,
          dataInicio: vinculo.dataInicio,
          dataFim: vinculo.dataFim,
        },
        contribuicoes.map(c => ({ competencia: c.competencia }))
      );
      
      if (analiseResult) {
        await storage.createAnaliseCompetencia({
          planejamentoId: id,
          vinculoId: vinculo.id,
          vinculoSequencia: vinculo.sequencia,
          empregador: vinculo.empregador,
          mesesEsperados: analiseResult.mesesEsperados,
          mesesRegistrados: analiseResult.mesesRegistrados,
          mesesFaltantes: analiseResult.mesesFaltantes,
          impacto: analiseResult.impacto,
          mensagem: analiseResult.mensagem,
        });
        
        // Generate pendência automatically when impact is "alto"
        if (analiseResult.impacto === "alto" && analiseResult.mesesFaltantes.length > 0) {
          await storage.createPendencia({
            planejamentoId: id,
            tipo: "remuneracoes_faltantes",
            prioridade: "alta",
            titulo: `Remunerações faltantes no vínculo ${vinculo.empregador}`,
            descricao: analiseResult.mensagem,
            vinculoId: vinculo.id,
            status: "aberta",
          });
        }
        
        analiseCompetenciasResults.push(analiseResult);
      }
    }

    const pendenciasGeradasCompetencias = analiseCompetenciasResults.filter(a => a.impacto === "alto" && a.mesesFaltantes.length > 0).length;

    // Fase 2: Detectar remunerações problemáticas
    await storage.deleteProblemasRemuneracaoByPlanejamento(id);
    await storage.deletePendenciasByTipo(id, "remuneracao_zerada");
    await storage.deletePendenciasByTipo(id, "remuneracao_ausente");
    await storage.deletePendenciasByTipo(id, "remuneracao_muito_baixa");

    let problemasRemuneracaoResults: ProblemaRemuneracaoResult[] = [];
    let pendenciasGeradasRemuneracao = 0;

    for (const vinculo of vinculosSalvos) {
      const contribuicoes = await storage.getContribuicoesCnis(vinculo.id);
      
      const problemas = detectarRemuneracoesProblematicas(
        vinculo.id,
        vinculo.empregador,
        contribuicoes.map(c => ({
          competencia: c.competencia,
          remuneracao: c.remuneracao
        }))
      );

      for (const problema of problemas) {
        await storage.createProblemaRemuneracao({
          planejamentoId: id,
          vinculoId: problema.vinculoId,
          competencia: problema.competencia,
          valor: problema.valor,
          tipo: problema.tipo,
          gravidade: problema.gravidade,
          mensagem: problema.mensagem,
        });

        // Gerar pendências para problemas de gravidade "alta"
        if (problema.gravidade === "alta") {
          const tiposPendencia: Record<string, string> = {
            zerada: "remuneracao_zerada",
            ausente: "remuneracao_ausente",
            muito_baixa: "remuneracao_muito_baixa"
          };

          await storage.createPendencia({
            planejamentoId: id,
            tipo: tiposPendencia[problema.tipo] || "remuneracao_problematica",
            prioridade: "alta",
            titulo: problema.tipo === "zerada" 
              ? `Remuneração zerada detectada no vínculo ${vinculo.empregador}`
              : `Remuneração ausente detectada no vínculo ${vinculo.empregador}`,
            descricao: problema.mensagem,
            vinculoId: vinculo.id,
            status: "aberta",
          });
          pendenciasGeradasRemuneracao++;
        }

        problemasRemuneracaoResults.push(problema);
      }
    }

    return res.status(200).json({
      message: "CNIS analisado com sucesso",
      vinculos: analiseCnis.vinculos.length,
      alertas: analiseCnis.alertas.length,
      resumo: analiseCnis.resumoGeral,
      analiseCompetencias: analiseCompetenciasResults.length,
      pendenciasGeradasCompetencias,
      problemasRemuneracao: problemasRemuneracaoResults.length,
      pendenciasGeradasRemuneracao,
    });
  } catch (error) {
    console.error("Erro ao analisar CNIS:", error);
    
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Erro ao analisar CNIS" 
    });
  }
});

router.post("/:id/cruzar-documento", upload.single("documento"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipoDocumento } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo PDF do documento é obrigatório" });
    }

    if (!tipoDocumento) {
      return res.status(400).json({ error: "tipoDocumento é obrigatório (CTPS, PPP, FGTS, etc.)" });
    }

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const vinculos = await storage.getVinculosCnis(id);
    
    if (vinculos.length === 0) {
      return res.status(400).json({ 
        error: "Nenhum vínculo CNIS encontrado. Analise o CNIS primeiro." 
      });
    }

    const vinculosExtraidos: VinculoExtraido[] = vinculos.map(v => ({
      sequencia: v.sequencia,
      nit: v.nit || undefined,
      empregador: v.empregador,
      cnpjCpf: v.cnpjCpf || undefined,
      tipoVinculo: v.tipoVinculo || undefined,
      dataInicio: v.dataInicio || undefined,
      dataFim: v.dataFim || undefined,
      ultimaRemuneracao: v.ultimaRemuneracao || undefined,
      indicadores: v.indicadores || undefined,
      observacoes: v.observacoes || undefined,
      origemDocumento: v.origemDocumento,
    }));

    const pdfBase64 = convertPDFToBase64(req.file.buffer);
    const analise = await analisarDocumentoComparativo(pdfBase64, tipoDocumento, vinculosExtraidos);

    for (const inc of analise.inconsistencias) {
      const vinculoId = inc.vinculoSequencia 
        ? vinculos.find(v => v.sequencia === inc.vinculoSequencia)?.id 
        : null;

      await storage.createInconsistencia({
        planejamentoId: id,
        tipo: inc.tipo,
        gravidade: inc.gravidade,
        titulo: inc.titulo,
        descricao: inc.descricao,
        documentoOrigem: inc.documentoOrigem,
        documentoComparacao: inc.documentoComparacao || null,
        vinculoId: vinculoId || null,
        dadosOrigem: inc.dadosOrigem || null,
        dadosComparacao: inc.dadosComparacao || null,
        sugestaoCorrecao: inc.sugestaoCorrecao || null,
        status: "pendente",
      });
    }

    for (const pend of analise.pendencias) {
      const vinculoId = pend.vinculoSequencia 
        ? vinculos.find(v => v.sequencia === pend.vinculoSequencia)?.id 
        : null;

      await storage.createPendencia({
        planejamentoId: id,
        titulo: pend.titulo,
        descricao: pend.descricao,
        tipo: pend.tipo,
        prioridade: pend.prioridade,
        acaoNecessaria: pend.acaoNecessaria || null,
        documentosNecessarios: pend.documentosNecessarios || [],
        vinculoId: vinculoId || null,
        status: "aberta",
      });
    }

    return res.status(200).json({
      message: `Documento ${tipoDocumento} analisado com sucesso`,
      inconsistencias: analise.inconsistencias.length,
      pendencias: analise.pendencias.length,
      resumo: analise.resumoAnalise,
    });
  } catch (error) {
    console.error("Erro ao cruzar documento:", error);
    
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Erro ao cruzar documento" 
    });
  }
});

router.get("/:id/vinculos", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const vinculos = await storage.getVinculosCnis(id);
    
    const vinculosComContribuicoes = await Promise.all(
      vinculos.map(async (v) => {
        const contribuicoes = await storage.getContribuicoesCnis(v.id);
        return { ...v, contribuicoes };
      })
    );

    return res.status(200).json(vinculosComContribuicoes);
  } catch (error) {
    console.error("Erro ao buscar vínculos:", error);
    
    return res.status(500).json({ 
      error: "Erro ao buscar vínculos" 
    });
  }
});

// Endpoint de competências (alias e principal usam a mesma lógica)
const competenciasHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try to get saved analysis from database first (persisted data)
    const savedAnalises = await storage.getAnaliseCompetencias(id);
    
    if (savedAnalises.length > 0) {
      // Use saved data from database - no need to check in-memory vínculos
      const analises: AnaliseCompetenciasResult[] = savedAnalises.map(a => ({
        vinculoId: a.vinculoId,
        vinculoSequencia: a.vinculoSequencia,
        empregador: a.empregador,
        mesesEsperados: a.mesesEsperados,
        mesesRegistrados: a.mesesRegistrados,
        mesesFaltantes: a.mesesFaltantes,
        impacto: a.impacto as "baixo" | "alto",
        mensagem: a.mensagem || "",
      }));

      const resumo = {
        totalVinculos: analises.length,
        vinculosComFaltas: analises.filter(a => a.mesesFaltantes.length > 0).length,
        vinculosAltoImpacto: analises.filter(a => a.impacto === "alto").length,
        totalMesesFaltantes: analises.reduce((acc, a) => acc + a.mesesFaltantes.length, 0),
      };

      return res.status(200).json({
        analises,
        resumo,
        source: "database",
      });
    }

    // If no saved data, check if we can calculate from in-memory vínculos
    const vinculos = await storage.getVinculosCnis(id);
    
    if (vinculos.length === 0) {
      return res.status(400).json({ 
        error: "Nenhum vínculo encontrado. Analise o CNIS primeiro." 
      });
    }

    // Recalculate from in-memory data
    const contribuicoesPorVinculo: Record<string, { competencia: string }[]> = {};
    
    for (const vinculo of vinculos) {
      const contribuicoes = await storage.getContribuicoesCnis(vinculo.id);
      contribuicoesPorVinculo[vinculo.id] = contribuicoes.map(c => ({
        competencia: c.competencia
      }));
    }

    const vinculosParaAnalise = vinculos.map(v => ({
      id: v.id,
      sequencia: v.sequencia,
      empregador: v.empregador,
      dataInicio: v.dataInicio,
      dataFim: v.dataFim,
    }));

    const analises = analisarCompetenciasTodosVinculos(vinculosParaAnalise, contribuicoesPorVinculo);

    const resumo = {
      totalVinculos: vinculos.length,
      vinculosComFaltas: analises.filter(a => a.mesesFaltantes.length > 0).length,
      vinculosAltoImpacto: analises.filter(a => a.impacto === "alto").length,
      totalMesesFaltantes: analises.reduce((acc, a) => acc + a.mesesFaltantes.length, 0),
    };

    return res.status(200).json({
      analises,
      resumo,
      source: "calculated",
    });
  } catch (error) {
    console.error("Erro ao analisar competências:", error);
    
    return res.status(500).json({ 
      error: "Erro ao analisar competências" 
    });
  }
};

// Registra ambos os endpoints (alias e principal)
router.get("/:id/competencias", competenciasHandler);
router.get("/:id/analisar-competencias", competenciasHandler);

router.get("/:id/inconsistencias", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const inconsistencias = await storage.getInconsistencias(id);

    return res.status(200).json(inconsistencias);
  } catch (error) {
    console.error("Erro ao buscar inconsistências:", error);
    
    return res.status(500).json({ 
      error: "Erro ao buscar inconsistências" 
    });
  }
});

router.get("/:id/pendencias", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const pendencias = await storage.getPendencias(id);

    return res.status(200).json(pendencias);
  } catch (error) {
    console.error("Erro ao buscar pendências:", error);
    
    return res.status(500).json({ 
      error: "Erro ao buscar pendências" 
    });
  }
});

router.patch("/:id/pendencias/:pendenciaId", async (req: Request, res: Response) => {
  try {
    const { id, pendenciaId } = req.params;
    const { status, observacoes } = req.body;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (observacoes) updates.observacoes = observacoes;
    if (status === "resolvida") updates.resolvidaEm = new Date();

    const updated = await storage.updatePendencia(pendenciaId, updates);

    return res.status(200).json({
      message: "Pendência atualizada com sucesso",
      pendencia: updated,
    });
  } catch (error) {
    console.error("Erro ao atualizar pendência:", error);
    
    return res.status(500).json({ 
      error: "Erro ao atualizar pendência" 
    });
  }
});

router.post("/:id/parecer", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parecer } = req.body;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    await storage.updatePlanejamento(id, {
      parecerGerado: parecer,
      status: parecer ? "parecer_gerado" : planejamento.status,
    });

    return res.status(200).json({
      message: "Parecer salvo com sucesso",
    });
  } catch (error) {
    console.error("Erro ao salvar parecer:", error);
    
    return res.status(500).json({ 
      error: "Erro ao salvar parecer" 
    });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    await storage.updatePlanejamento(id, { status: "arquivado" });

    return res.status(200).json({
      message: "Planejamento excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir planejamento:", error);
    
    return res.status(500).json({ 
      error: "Erro ao excluir planejamento" 
    });
  }
});

// Fase 2: Rotas de problemas de remuneração
router.get("/:id/problemas-remuneracao", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const problemas = await storage.getProblemasRemuneracao(id);

    return res.status(200).json(problemas);
  } catch (error) {
    console.error("Erro ao buscar problemas de remuneração:", error);
    
    return res.status(500).json({ 
      error: "Erro ao buscar problemas de remuneração" 
    });
  }
});

router.get("/:id/remuneracoes", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const remuneracoes = await storage.getRemuneracoesByPlanejamento(id);

    return res.status(200).json(remuneracoes);
  } catch (error) {
    console.error("Erro ao buscar remunerações:", error);
    
    return res.status(500).json({ 
      error: "Erro ao buscar remunerações" 
    });
  }
});

// Fase 3: Rotas de identificação e validação
router.get("/:id/identificacao", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const identificacao = await storage.getIdentificacaoCnis(id);

    return res.status(200).json(identificacao || null);
  } catch (error) {
    console.error("Erro ao buscar identificação:", error);
    
    return res.status(500).json({ 
      error: "Erro ao buscar identificação" 
    });
  }
});

router.get("/:id/alertas-identificacao", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const alertas = await storage.getAlertasIdentificacao(id);

    return res.status(200).json(alertas);
  } catch (error) {
    console.error("Erro ao buscar alertas de identificação:", error);
    
    return res.status(500).json({ 
      error: "Erro ao buscar alertas de identificação" 
    });
  }
});

// Fase 4: Checklist de Validação (3 Pilares)
router.get("/:id/checklist", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const checklist = await storage.getChecklistValidacao(id);

    return res.status(200).json(checklist || null);
  } catch (error) {
    console.error("Erro ao buscar checklist:", error);
    
    return res.status(500).json({ 
      error: "Erro ao buscar checklist de validação" 
    });
  }
});

router.post("/:id/checklist", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pilar, valor } = req.body;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    const validPilares = ["identificacaoConfirmada", "vinculosExtraidos", "remuneracoesAnalisadas"];
    if (!validPilares.includes(pilar)) {
      return res.status(400).json({ error: "Pilar inválido" });
    }

    const updateData: Record<string, unknown> = {};
    updateData[pilar] = valor === true;
    if (valor === true) {
      updateData[`${pilar}Em`] = new Date();
    } else {
      updateData[`${pilar}Em`] = null;
    }

    const checklist = await storage.upsertChecklistValidacao(id, updateData);

    return res.status(200).json(checklist);
  } catch (error) {
    console.error("Erro ao atualizar checklist:", error);
    
    return res.status(500).json({ 
      error: "Erro ao atualizar checklist de validação" 
    });
  }
});

// Fase 4: Observações de Vínculo
router.put("/:id/vinculos/:vinculoId/observacoes", async (req: Request, res: Response) => {
  try {
    const { id, vinculoId } = req.params;
    const { observacoes } = req.body;

    const planejamento = await storage.getPlanejamento(id);
    
    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    if (typeof observacoes !== "string") {
      return res.status(400).json({ error: "Observações deve ser uma string" });
    }

    const vinculoAtualizado = await storage.updateVinculoObservacoes(vinculoId, observacoes);

    if (!vinculoAtualizado) {
      return res.status(404).json({ error: "Vínculo não encontrado" });
    }

    return res.status(200).json(vinculoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar observações do vínculo:", error);
    
    return res.status(500).json({ 
      error: "Erro ao atualizar observações do vínculo" 
    });
  }
});

router.get("/:id/resumo/pdf", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[resumo/pdf] Gerando PDF para planejamento ${id}`);

    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const planejamento = await storage.getPlanejamento(id);

    if (!planejamento) {
      return res.status(404).json({ error: "Planejamento não encontrado" });
    }

    if (planejamento.userId !== userId && req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Sem permissão para acessar este planejamento" });
    }

    if (!planejamento.resumoExecutivo) {
      return res.status(400).json({ error: "Resumo executivo não foi gerado ainda" });
    }

    const pdfBuffer = await gerarResumoPDF({
      clienteNome: planejamento.clienteNome,
      clienteCpf: planejamento.clienteCpf,
      resumoExecutivo: planejamento.resumoExecutivo,
      dataGeracao: new Date(),
    });

    const nomeArquivo = `resumo_${planejamento.clienteNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log(`[resumo/pdf] PDF gerado com sucesso: ${nomeArquivo}`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("[resumo/pdf] Erro ao gerar PDF:", error);
    return res.status(500).json({ error: "Erro ao gerar PDF" });
  }
});

export default router;
