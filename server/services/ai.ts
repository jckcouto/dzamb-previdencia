import { getConfiguredProvider, createAIProvider, type DadosExtraidos } from "./ai-providers";

export type { DadosExtraidos } from "./ai-providers";

function sanitizeAndParseJSON(jsonString: string): any {
  // Primeira limpeza básica
  let sanitized = jsonString
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ');
  
  // Tentar parse direto
  try {
    return JSON.parse(sanitized);
  } catch (firstError) {
    console.log("[sanitizeAndParseJSON] Parse direto falhou, aplicando sanitização...");
  }
  
  // Segunda tentativa: sanitização mais agressiva
  sanitized = sanitized
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/}\s*{/g, '},{')
    .replace(/]\s*\[/g, '],[')
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    .replace(/:\s*'([^']*)'/g, ': "$1"');
  
  try {
    return JSON.parse(sanitized);
  } catch (secondError) {
    console.log("[sanitizeAndParseJSON] Segunda tentativa falhou, tentando extrair JSON válido...");
  }
  
  // Terceira tentativa: extrair apenas o objeto JSON principal
  const jsonStartIndex = sanitized.indexOf('{');
  const jsonEndIndex = sanitized.lastIndexOf('}');
  
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    const extracted = sanitized.slice(jsonStartIndex, jsonEndIndex + 1);
    
    try {
      return JSON.parse(extracted);
    } catch (thirdError) {
      console.log("[sanitizeAndParseJSON] Terceira tentativa falhou, tentando reparar estruturas...");
    }
    
    // Quarta tentativa: tentar reparar arrays truncados ou malformados
    let repaired = extracted;
    
    // Contar colchetes e chaves para verificar balanceamento
    const countOpen = (s: string, c: string) => (s.match(new RegExp('\\' + c, 'g')) || []).length;
    const openBraces = countOpen(repaired, '{');
    const closeBraces = countOpen(repaired, '}');
    const openBrackets = countOpen(repaired, '[');
    const closeBrackets = countOpen(repaired, ']');
    
    // Adicionar fechamentos faltantes
    if (openBraces > closeBraces) {
      repaired += '}'.repeat(openBraces - closeBraces);
    }
    if (openBrackets > closeBrackets) {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // Remover vírgulas finais antes de fechamentos
    repaired = repaired
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');
    
    try {
      return JSON.parse(repaired);
    } catch (fourthError) {
      console.log("[sanitizeAndParseJSON] Quarta tentativa falhou, tentando parse incremental...");
    }
    
    // Quinta tentativa: parse incremental - encontrar o maior JSON válido
    let validJson = null;
    let testString = extracted;
    
    // Tentar remover elementos do final até conseguir um JSON válido
    for (let i = 0; i < 50 && testString.length > 10; i++) {
      try {
        // Tentar fechar arrays/objetos abertos
        let attempt = testString;
        const opens = (attempt.match(/\[/g) || []).length;
        const closes = (attempt.match(/\]/g) || []).length;
        const openObjs = (attempt.match(/\{/g) || []).length;
        const closeObjs = (attempt.match(/\}/g) || []).length;
        
        // Limpar final e adicionar fechamentos
        attempt = attempt.replace(/,\s*$/, '');
        attempt += ']'.repeat(Math.max(0, opens - closes));
        attempt += '}'.repeat(Math.max(0, openObjs - closeObjs));
        
        validJson = JSON.parse(attempt);
        console.log("[sanitizeAndParseJSON] Parse incremental bem-sucedido após remover parte do final");
        return validJson;
      } catch {
        // Remover último elemento do array ou objeto
        testString = testString
          .replace(/,\s*"[^"]*"\s*:\s*("[^"]*"|[0-9.]+|null|true|false|\[[^\]]*\]|\{[^}]*\})\s*$/, '')
          .replace(/,\s*("[^"]*"|[0-9.]+|null|true|false)\s*$/, '')
          .replace(/,\s*\{[^}]*$/, '')
          .replace(/,\s*\[[^\]]*$/, '');
      }
    }
    
    // Última tentativa: log detalhado e erro
    console.error("[sanitizeAndParseJSON] Todas as tentativas falharam");
    console.error("[sanitizeAndParseJSON] JSON (primeiros 1000 chars):", jsonString.substring(0, 1000));
    console.error("[sanitizeAndParseJSON] JSON (últimos 500 chars):", jsonString.substring(jsonString.length - 500));
    throw new Error(`Erro ao parsear JSON da IA: JSON malformado não pôde ser recuperado`);
  }
  
  throw new Error(`Erro ao parsear JSON da IA: Estrutura JSON não encontrada na resposta`);
}

export async function extrairDadosDeDocumentos(
  pdfBase64List: string[],
  providerName?: string
): Promise<DadosExtraidos> {
  const provider = providerName 
    ? createAIProvider(providerName)
    : getConfiguredProvider();

  console.log(`Extraindo dados com ${provider.name}...`);
  return await provider.extractDataFromDocuments(pdfBase64List);
}

export async function gerarParecerPrevidenciario(
  dados: DadosExtraidos,
  providerName?: string,
  contextoAdicional?: { resumoAta?: string; dadosCalculoExterno?: any }
): Promise<string> {
  const provider = providerName 
    ? createAIProvider(providerName)
    : getConfiguredProvider();

  console.log(`Gerando parecer com ${provider.name}...`);
  return await provider.generateParecer(dados, contextoAdicional);
}

export async function analisarAtaReuniao(
  textoAta: string,
  providerName?: string
): Promise<string> {
  const provider = getConfiguredProvider();
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Nenhuma API de IA configurada");
  }

  const prompt = `Você é um especialista em direito previdenciário brasileiro. 
Analise o texto a seguir, extraído de uma ata de reunião com um cliente, e retorne um resumo em bullet points com:
- Principais pontos de atenção
- Dúvidas do cliente
- Informações que precisam ser validadas nos documentos
- Expectativas do cliente quanto à aposentadoria
- Histórico laboral mencionado

Texto da ata:
${textoAta}

Retorne o resumo em formato Markdown bem estruturado.`;

  console.log("[analisarAtaReuniao] Iniciando análise de ata com OpenAI...");
  
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[analisarAtaReuniao] ✅ Ata analisada com sucesso");
    return data.content[0].text;
  } else if (process.env.OPENAI_API_KEY) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[analisarAtaReuniao] ✅ Ata analisada com sucesso");
    return data.choices[0].message.content;
  }

  throw new Error("Nenhum provedor de IA disponível");
}

export async function importarCalculoExterno(
  pdfBase64: string,
  providerName?: string
): Promise<any> {
  const prompt = `Analise este relatório de cálculo previdenciário e extraia as seguintes informações em formato JSON:
- Uma lista de cenários de aposentadoria
- Para cada cenário, extraia:
  - Nome do cenário/regra
  - Renda Mensal Inicial (RMI) projetada
  - Tempo de contribuição necessário
  - Data estimada de elegibilidade
  - Valor do benefício estimado
  - Observações relevantes

Retorne APENAS o JSON válido, sem texto adicional. Formato esperado:
{
  "cenarios": [
    {
      "nome": "string",
      "rmi": number,
      "tempoContribuicao": { "anos": number, "meses": number },
      "dataElegibilidade": "YYYY-MM-DD",
      "valorBeneficio": number,
      "observacoes": "string"
    }
  ],
  "resumoGeral": "string"
}`;

  if (process.env.OPENAI_API_KEY) {
    // Extrair texto do PDF primeiro (OpenAI não suporta PDFs diretamente)
    const { PDFParse } = await import("pdf-parse");
    const buffer = Buffer.from(pdfBase64, "base64");
    const parser = new PDFParse({ data: buffer });
    const pdfResult = await parser.getText();
    const textoExtraido = pdfResult.text;
    
    console.log("[importarCalculoExterno] Iniciando importação de cálculo com OpenAI...");
    console.log("[importarCalculoExterno] Tamanho do texto extraído:", textoExtraido.length, "caracteres");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${prompt}\n\n--- CONTEÚDO DO DOCUMENTO ---\n\n${textoExtraido}`,
          },
        ],
        max_completion_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }
    console.log("[importarCalculoExterno] ✅ Cálculo importado com sucesso");
    return sanitizeAndParseJSON(jsonMatch[0]);
  } else if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }
    return sanitizeAndParseJSON(jsonMatch[0]);
  }

  throw new Error("Nenhum provedor de IA disponível");
}

export async function gerarResumoExecutivo(
  parecerCompleto: string,
  providerName?: string
): Promise<string> {
  const prompt = `Resuma o seguinte parecer técnico previdenciário em uma linguagem simples e direta, adequada para uma pessoa leiga. 

Foque em:
- Conclusões principais
- Próximos passos recomendados
- Prazos importantes
- Ações que o cliente precisa tomar

Mantenha o tom profissional mas acessível. Use bullet points quando apropriado.

Parecer completo:
${parecerCompleto}`;

  console.log("[gerarResumoExecutivo] Iniciando geração de resumo com OpenAI...");
  
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[gerarResumoExecutivo] ✅ Resumo gerado com sucesso");
    return data.content[0].text;
  } else if (process.env.OPENAI_API_KEY) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[gerarResumoExecutivo] ✅ Resumo gerado com sucesso");
    return data.choices[0].message.content;
  }

  throw new Error("Nenhum provedor de IA disponível");
}

export function getAvailableProviders(): string[] {
  const providers = [];
  
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.ANTHROPIC_API_KEY) providers.push("claude");
  if (process.env.GEMINI_API_KEY) providers.push("gemini");
  if (process.env.DEEPSEEK_API_KEY) providers.push("deepseek");
  
  return providers;
}

export function getDefaultProvider(): string {
  return process.env.AI_PROVIDER || "openai";
}

// ============================================
// ANÁLISE DE COMPETÊNCIAS
// ============================================

export interface AnaliseCompetenciasResult {
  vinculoId: string;
  vinculoSequencia: number;
  empregador: string;
  mesesEsperados: number;
  mesesRegistrados: number;
  mesesFaltantes: string[]; // formato "MM/YYYY"
  impacto: "baixo" | "alto";
  mensagem: string;
}

const DATA_CORTE_CALCULO = new Date(1994, 6, 1); // Julho 1994

function parseDataBrasileira(dataStr: string | null | undefined): Date | null {
  if (!dataStr) return null;
  
  // Tenta formato DD/MM/YYYY
  const partes = dataStr.split("/");
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // mês é 0-indexed
    const ano = parseInt(partes[2], 10);
    if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
      return new Date(ano, mes, dia);
    }
  }
  
  return null;
}

function formatarCompetencia(date: Date): string {
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const ano = date.getFullYear();
  return `${mes}/${ano}`;
}

function gerarMesesNoPeriodo(dataInicio: Date, dataFim: Date): string[] {
  const meses: string[] = [];
  const atual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
  const fim = new Date(dataFim.getFullYear(), dataFim.getMonth(), 1);
  
  while (atual <= fim) {
    meses.push(formatarCompetencia(atual));
    atual.setMonth(atual.getMonth() + 1);
  }
  
  return meses;
}

function classificarImpacto(mesesFaltantes: string[]): { impacto: "baixo" | "alto"; mesesAltoImpacto: string[]; mesesBaixoImpacto: string[] } {
  const mesesAltoImpacto: string[] = [];
  const mesesBaixoImpacto: string[] = [];
  
  for (const competencia of mesesFaltantes) {
    const partes = competencia.split("/");
    const mes = parseInt(partes[0], 10) - 1;
    const ano = parseInt(partes[1], 10);
    const dataCompetencia = new Date(ano, mes, 1);
    
    if (dataCompetencia >= DATA_CORTE_CALCULO) {
      mesesAltoImpacto.push(competencia);
    } else {
      mesesBaixoImpacto.push(competencia);
    }
  }
  
  return {
    impacto: mesesAltoImpacto.length > 0 ? "alto" : "baixo",
    mesesAltoImpacto,
    mesesBaixoImpacto
  };
}

function gerarMensagemCompetencias(
  mesesFaltantes: string[],
  mesesAltoImpacto: string[],
  mesesBaixoImpacto: string[],
  impacto: "baixo" | "alto"
): string {
  if (mesesFaltantes.length === 0) {
    return "Todas as competências do período estão registradas.";
  }
  
  const primeiroFaltante = mesesFaltantes[0];
  const ultimoFaltante = mesesFaltantes[mesesFaltantes.length - 1];
  const periodoStr = mesesFaltantes.length === 1 
    ? primeiroFaltante 
    : `${primeiroFaltante} a ${ultimoFaltante}`;
  
  const mesesTexto = mesesFaltantes.length === 1 ? "mês" : "meses";
  
  if (impacto === "baixo") {
    return `Faltam ${mesesFaltantes.length} ${mesesTexto} de remuneração (${periodoStr}), porém não impactam o cálculo pois são anteriores a 07/1994.`;
  } else if (mesesBaixoImpacto.length === 0) {
    return `Faltam ${mesesFaltantes.length} ${mesesTexto} de remuneração (${periodoStr}). ATENÇÃO: Esses meses impactam o cálculo e precisam ser regularizados.`;
  } else {
    return `Faltam ${mesesFaltantes.length} ${mesesTexto} de remuneração (${periodoStr}). ATENÇÃO: ${mesesAltoImpacto.length} ${mesesAltoImpacto.length === 1 ? "mês impacta" : "meses impactam"} o cálculo (após 07/1994) e ${mesesAltoImpacto.length === 1 ? "precisa" : "precisam"} ser regularizados. ${mesesBaixoImpacto.length} ${mesesBaixoImpacto.length === 1 ? "mês não impacta" : "meses não impactam"} (antes de 07/1994).`;
  }
}

export interface VinculoParaAnalise {
  id: string;
  sequencia: number;
  empregador: string;
  dataInicio: string | null;
  dataFim: string | null;
}

export interface ContribuicaoParaAnalise {
  competencia: string;
}

export function analisarCompetencias(
  vinculo: VinculoParaAnalise,
  contribuicoesRegistradas: ContribuicaoParaAnalise[]
): AnaliseCompetenciasResult {
  const dataInicio = parseDataBrasileira(vinculo.dataInicio);
  const dataFim = parseDataBrasileira(vinculo.dataFim) || new Date(); // Se não tem data fim, usa hoje
  
  if (!dataInicio) {
    return {
      vinculoId: vinculo.id,
      vinculoSequencia: vinculo.sequencia,
      empregador: vinculo.empregador,
      mesesEsperados: 0,
      mesesRegistrados: contribuicoesRegistradas.length,
      mesesFaltantes: [],
      impacto: "baixo",
      mensagem: "Não foi possível analisar: data de início não disponível."
    };
  }
  
  // Gera todos os meses esperados no período
  const mesesEsperados = gerarMesesNoPeriodo(dataInicio, dataFim);
  
  // Extrai competências registradas (normalizadas)
  const competenciasRegistradas = new Set(
    contribuicoesRegistradas.map(c => c.competencia.trim())
  );
  
  // Identifica meses faltantes
  const mesesFaltantes = mesesEsperados.filter(mes => !competenciasRegistradas.has(mes));
  
  // Classifica impacto
  const { impacto, mesesAltoImpacto, mesesBaixoImpacto } = classificarImpacto(mesesFaltantes);
  
  // Gera mensagem
  const mensagem = gerarMensagemCompetencias(mesesFaltantes, mesesAltoImpacto, mesesBaixoImpacto, impacto);
  
  return {
    vinculoId: vinculo.id,
    vinculoSequencia: vinculo.sequencia,
    empregador: vinculo.empregador,
    mesesEsperados: mesesEsperados.length,
    mesesRegistrados: contribuicoesRegistradas.length,
    mesesFaltantes,
    impacto,
    mensagem
  };
}

export function analisarCompetenciasTodosVinculos(
  vinculos: VinculoParaAnalise[],
  contribuicoesPorVinculo: Record<string, ContribuicaoParaAnalise[]>
): AnaliseCompetenciasResult[] {
  return vinculos.map(vinculo => {
    const contribuicoes = contribuicoesPorVinculo[vinculo.id] || [];
    return analisarCompetencias(vinculo, contribuicoes);
  });
}

export interface ProblemaRemuneracaoResult {
  vinculoId: string;
  competencia: string;
  valor: string | null;
  tipo: "zerada" | "muito_baixa" | "ausente";
  gravidade: "alta" | "media";
  mensagem: string;
}

export interface ContribuicaoParaDeteccao {
  competencia: string;
  remuneracao: string | null;
}

function converterValorParaNumero(valor: string | null | undefined): number | null {
  if (!valor || valor.trim() === "") return null;
  
  const valorLimpo = valor
    .replace(/R\$/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim();
  
  const numero = parseFloat(valorLimpo);
  return isNaN(numero) ? null : numero;
}

export function detectarRemuneracoesProblematicas(
  vinculoId: string,
  empregador: string,
  contribuicoes: ContribuicaoParaDeteccao[]
): ProblemaRemuneracaoResult[] {
  const problemas: ProblemaRemuneracaoResult[] = [];
  
  for (const contrib of contribuicoes) {
    const valorNumerico = converterValorParaNumero(contrib.remuneracao);
    
    if (valorNumerico === null || contrib.remuneracao === null || contrib.remuneracao.trim() === "") {
      problemas.push({
        vinculoId,
        competencia: contrib.competencia,
        valor: contrib.remuneracao,
        tipo: "ausente",
        gravidade: "alta",
        mensagem: `Competência ${contrib.competencia} do vínculo "${empregador}" está sem valor de remuneração. Solicitar correção junto ao INSS.`
      });
    } else if (valorNumerico === 0) {
      problemas.push({
        vinculoId,
        competencia: contrib.competencia,
        valor: contrib.remuneracao,
        tipo: "zerada",
        gravidade: "alta",
        mensagem: `Competência ${contrib.competencia} do vínculo "${empregador}" está com valor zerado. Solicitar correção junto ao INSS.`
      });
    } else if (valorNumerico < 100) {
      problemas.push({
        vinculoId,
        competencia: contrib.competencia,
        valor: contrib.remuneracao,
        tipo: "muito_baixa",
        gravidade: "media",
        mensagem: `Competência ${contrib.competencia} do vínculo "${empregador}" possui remuneração muito baixa (${contrib.remuneracao}). Verificar se o valor está correto.`
      });
    }
  }
  
  return problemas;
}

export function detectarRemuneracoesProblematicasTodosVinculos(
  vinculos: { id: string; empregador: string }[],
  contribuicoesPorVinculoId: Record<string, ContribuicaoParaDeteccao[]>
): ProblemaRemuneracaoResult[] {
  const todosProblemas: ProblemaRemuneracaoResult[] = [];
  
  for (const vinculo of vinculos) {
    const contribuicoes = contribuicoesPorVinculoId[vinculo.id] || [];
    const problemas = detectarRemuneracoesProblematicas(vinculo.id, vinculo.empregador, contribuicoes);
    todosProblemas.push(...problemas);
  }
  
  return todosProblemas;
}

export interface VinculoExtraido {
  sequencia: number;
  nit?: string;
  empregador: string;
  cnpjCpf?: string;
  tipoVinculo?: string;
  dataInicio?: string;
  dataFim?: string;
  ultimaRemuneracao?: string;
  indicadores?: string[];
  observacoes?: string;
  origemDocumento: string;
}

export interface ContribuicaoExtraida {
  competencia: string;
  remuneracao?: string;
  indicadores?: string[];
}

export interface IdentificacaoExtraida {
  nomeCompleto?: string;
  cpf?: string;
  nomeMae?: string;
  nits?: string[];
  dataNascimento?: string;
}

export interface GapContribuicao {
  inicio: string;
  fim: string;
  duracao: string;
}

export interface AnaliseCnisResult {
  identificacao: IdentificacaoExtraida;
  vinculos: VinculoExtraido[];
  contribuicoesPorVinculo: Record<number, ContribuicaoExtraida[]>;
  resumoGeral: {
    totalVinculos: number;
    totalContribuicoes: number;
    tempoTotalContribuicao?: string;
    primeiraContribuicao?: string;
    ultimaContribuicao?: string;
    gaps?: GapContribuicao[];
  };
  alertas: string[];
}

export async function analisarCnisDetalhado(
  pdfBase64: string,
  providerName?: string
): Promise<AnaliseCnisResult> {
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  
  const prompt = `Você é um especialista em análise de CNIS (Cadastro Nacional de Informações Sociais) brasileiro.

Analise o documento CNIS anexado e extraia TODOS os dados de forma estruturada com MÁXIMA PRECISÃO.

⚠️ INSTRUÇÕES CRÍTICAS DE VALIDAÇÃO:

1. DATA DE REFERÊNCIA: Hoje é ${dataHoje}. Use esta data para todas as validações.

2. VALIDAÇÃO DE DATA DE NASCIMENTO:
   - Extraia a data de nascimento do cabeçalho do CNIS
   - Esta data é OBRIGATÓRIA para validações
   - Se não encontrar, retorne "dataNascimento": null e adicione alerta

3. VALIDAÇÃO DE CONTRIBUIÇÕES:
   - Primeira contribuição DEVE ser APÓS data de nascimento + 14 anos (idade mínima para trabalhar)
   - Última contribuição DEVE ser ANTES ou IGUAL a hoje
   - Se data de contribuição > hoje, é PROJEÇÃO FUTURA e NÃO conta no tempo total
   - Se primeira contribuição < nascimento + 14 anos, adicione ALERTA CRÍTICO

4. CÁLCULO DE TEMPO DE CONTRIBUIÇÃO:
   - Conte APENAS competências com remuneração > 0
   - Conte APENAS competências até hoje (exclua futuro)
   - Identifique GAPS (períodos sem contribuição entre vínculos)
   - Formato: "X anos e Y meses" (exemplo: "5 anos e 3 meses")
   - VALIDAÇÃO OBRIGATÓRIA: tempo total DEVE ser menor que idade atual
   - Se tempo > idade, há ERRO CRÍTICO - adicione alerta

5. IDENTIFICAÇÃO DE GAPS:
   - Compare data fim do vínculo N com data início do vínculo N+1
   - Se diferença > 1 mês, há GAP
   - Liste todos os gaps no formato: "MM/YYYY a MM/YYYY (X meses)"

---

PRIMEIRO, extraia os DADOS DE IDENTIFICAÇÃO do segurado (geralmente no cabeçalho do CNIS):
- Nome completo do segurado
- CPF (formato: XXX.XXX.XXX-XX)
- Nome da mãe (se disponível)
- NIT(s) - pode haver mais de um NIT
- Data de nascimento (formato: DD/MM/YYYY) - OBRIGATÓRIO para validações

Para cada vínculo, extraia:
- Número sequencial do vínculo (Seq.)
- NIT/PIS/PASEP associado ao vínculo
- Nome do empregador/empresa ou tipo de recolhimento
- CNPJ ou CPF do empregador (se disponível)
- Tipo de vínculo (Empregado, Contribuinte Individual, Facultativo, etc.)
- Data de início do vínculo (primeira competência com remuneração)
- Data de fim do vínculo (última competência com remuneração OU data fim explícita)
- Última remuneração registrada
- Indicadores especiais (PREC-CADINI, AEXT-VI, IREM-INDPEND, IREC-MEI, IREC-LC123, PEXT, etc.)
- Observações relevantes

Para cada vínculo, liste as contribuições mensais visíveis:
- Competência (formato: MM/YYYY)
- Valor da remuneração (número)
- Indicadores associados à competência
- IMPORTANTE: Conte APENAS competências até a data de hoje

Identifique também:
- Alertas e problemas potenciais:
  * Vínculos sem data de fim
  * Contribuições faltantes (gaps)
  * Indicadores de pendência (IREC-INDPEND, etc.)
  * Valores zerados ou muito baixos
  * Projeções futuras (competências > hoje)
  * Tempo de contribuição impossível (> idade)
  
- Tempo total de contribuição:
  * Somar APENAS competências com remuneração > 0
  * Excluir competências futuras
  * Formato: "X anos e Y meses"
  * VALIDAR: tempo < idade atual
  
- Primeira contribuição:
  * Formato: MM/YYYY
  * Deve ser >= nascimento + 14 anos
  
- Última contribuição:
  * Formato: MM/YYYY
  * Deve ser <= data atual
  
- Gaps (períodos sem contribuição):
  * Listar todos os períodos sem contribuição
  * Formato estruturado com inicio, fim e duracao

---

ALERTAS OBRIGATÓRIOS:

Se tempo total > idade atual:
  Adicionar: "ERRO CRÍTICO: Tempo de contribuição (X anos) maior que idade do segurado (Y anos). Verificar cálculo."

Se primeira contribuição < nascimento + 14 anos:
  Adicionar: "ALERTA: Primeira contribuição antes da idade mínima para trabalhar (14 anos)."

Se há gaps > 12 meses:
  Adicionar: "ATENÇÃO: Período de X anos sem contribuição entre MM/YYYY e MM/YYYY."

Se há projeções futuras:
  Adicionar: "AVISO: Vínculo inclui competências futuras até MM/YYYY. Não contam no tempo atual."

Se valores zerados:
  Adicionar: "ALERTA: Competências com remuneração zerada detectadas."

---

Retorne APENAS o JSON válido, sem texto adicional. Formato:

{
  "identificacao": {
    "nomeCompleto": "string ou null",
    "cpf": "string ou null",
    "nomeMae": "string ou null",
    "nits": ["string"],
    "dataNascimento": "DD/MM/YYYY ou null"
  },
  "vinculos": [
    {
      "sequencia": 1,
      "nit": "string ou null",
      "empregador": "string",
      "cnpjCpf": "string ou null",
      "tipoVinculo": "string ou null",
      "dataInicio": "DD/MM/YYYY ou null",
      "dataFim": "DD/MM/YYYY ou null",
      "ultimaRemuneracao": "string ou null",
      "indicadores": ["string"],
      "observacoes": "string ou null",
      "origemDocumento": "CNIS"
    }
  ],
  "contribuicoesPorVinculo": {
    "1": [
      {
        "competencia": "MM/YYYY",
        "remuneracao": "string ou null",
        "indicadores": ["string"]
      }
    ]
  },
  "resumoGeral": {
    "totalVinculos": 0,
    "totalContribuicoes": 0,
    "tempoTotalContribuicao": "X anos e Y meses",
    "primeiraContribuicao": "MM/YYYY ou null",
    "ultimaContribuicao": "MM/YYYY ou null",
    "gaps": [
      {
        "inicio": "MM/YYYY",
        "fim": "MM/YYYY",
        "duracao": "X meses"
      }
    ]
  },
  "alertas": ["string com alertas críticos e avisos"]
}

IMPORTANTE: 
- Seja PRECISO nos cálculos
- VALIDE todas as datas
- EXCLUA projeções futuras
- IDENTIFIQUE gaps
- ADICIONE alertas obrigatórios`;

  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }
    return sanitizeAndParseJSON(jsonMatch[0]);
  } else if (process.env.OPENAI_API_KEY) {
    // Extrair texto do PDF primeiro (OpenAI não suporta PDFs diretamente)
    const { PDFParse } = await import("pdf-parse");
    const buffer = Buffer.from(pdfBase64, "base64");
    const parser = new PDFParse({ data: buffer });
    const pdfResult = await parser.getText();
    const textoExtraido = pdfResult.text;
    
    console.log("[analisarCnisDetalhado] Iniciando análise detalhada do CNIS com OpenAI...");
    console.log("[analisarCnisDetalhado] Tamanho do texto extraído:", textoExtraido.length, "caracteres");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${prompt}\n\n--- CONTEÚDO DO DOCUMENTO CNIS ---\n\n${textoExtraido}`,
          },
        ],
        max_completion_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    console.log("[analisarCnisDetalhado] Resposta da IA recebida. Tamanho:", responseText.length);
    console.log("[analisarCnisDetalhado] Primeiros 500 caracteres:", responseText.substring(0, 500));
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }
    console.log("[analisarCnisDetalhado] ✅ CNIS analisado com sucesso");
    return sanitizeAndParseJSON(jsonMatch[0]);
  }

  throw new Error("Nenhum provedor de IA disponível");
}

export interface InconsistenciaDetectada {
  tipo: string;
  gravidade: "baixa" | "media" | "alta" | "critica";
  titulo: string;
  descricao: string;
  documentoOrigem: string;
  documentoComparacao?: string;
  vinculoSequencia?: number;
  dadosOrigem?: any;
  dadosComparacao?: any;
  sugestaoCorrecao?: string;
}

export interface PendenciaGerada {
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: "baixa" | "media" | "alta" | "urgente";
  acaoNecessaria?: string;
  documentosNecessarios?: string[];
  vinculoSequencia?: number;
}

export interface AnaliseCruzadaResult {
  inconsistencias: InconsistenciaDetectada[];
  pendencias: PendenciaGerada[];
  resumoAnalise: string;
}

export async function analisarDocumentoComparativo(
  documentoBase64: string,
  tipoDocumento: string,
  vinculosExistentes: VinculoExtraido[],
  providerName?: string
): Promise<AnaliseCruzadaResult> {
  const vinculosJson = JSON.stringify(vinculosExistentes, null, 2);
  
  const prompt = `Você é um especialista em análise de documentos previdenciários brasileiros.

Você recebeu um documento do tipo "${tipoDocumento}" para analisar.

Aqui estão os vínculos já extraídos do CNIS do cliente:
${vinculosJson}

Analise o documento anexado e:
1. CRUZE as informações com os vínculos do CNIS
2. IDENTIFIQUE inconsistências (datas divergentes, empregadores diferentes, valores diferentes)
3. GERE pendências que precisam ser resolvidas junto ao INSS

Para cada inconsistência encontrada, classifique a gravidade:
- "baixa": pequenas divergências que não afetam o benefício
- "media": divergências que podem afetar cálculos
- "alta": divergências significativas que podem impactar a concessão
- "critica": divergências que podem invalidar períodos de contribuição

Para cada pendência, classifique a prioridade:
- "baixa": pode ser resolvida posteriormente
- "media": deve ser resolvida antes do requerimento
- "alta": impacta diretamente no benefício
- "urgente": precisa de ação imediata

Retorne APENAS o JSON válido:
{
  "inconsistencias": [
    {
      "tipo": "data_divergente|valor_divergente|vinculo_ausente|indicador_pendente|outro",
      "gravidade": "baixa|media|alta|critica",
      "titulo": "string curto descritivo",
      "descricao": "string detalhada",
      "documentoOrigem": "CNIS",
      "documentoComparacao": "${tipoDocumento}",
      "vinculoSequencia": 1,
      "dadosOrigem": {},
      "dadosComparacao": {},
      "sugestaoCorrecao": "string"
    }
  ],
  "pendencias": [
    {
      "titulo": "string curto",
      "descricao": "string detalhada",
      "tipo": "documento_faltante|retificacao_cnis|comprovacao_vinculo|outro",
      "prioridade": "baixa|media|alta|urgente",
      "acaoNecessaria": "string",
      "documentosNecessarios": ["string"],
      "vinculoSequencia": 1
    }
  ],
  "resumoAnalise": "string com resumo geral da análise"
}`;

  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: documentoBase64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }
    return sanitizeAndParseJSON(jsonMatch[0]);
  } else if (process.env.OPENAI_API_KEY) {
    // Extrair texto do PDF primeiro (OpenAI não suporta PDFs diretamente)
    const { PDFParse } = await import("pdf-parse");
    const buffer = Buffer.from(documentoBase64, "base64");
    const parser = new PDFParse({ data: buffer });
    const pdfResult = await parser.getText();
    const textoExtraido = pdfResult.text;
    
    console.log("[analisarDocumentoComparativo] Iniciando análise comparativa com OpenAI...");
    console.log("[analisarDocumentoComparativo] Tipo de documento:", tipoDocumento);
    console.log("[analisarDocumentoComparativo] Vínculos existentes:", vinculosExistentes.length);
    console.log("[analisarDocumentoComparativo] Tamanho do texto extraído:", textoExtraido.length, "caracteres");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${prompt}\n\n--- CONTEÚDO DO DOCUMENTO ---\n\n${textoExtraido}`,
          },
        ],
        max_completion_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }
    console.log("[analisarDocumentoComparativo] ✅ Análise comparativa concluída");
    return sanitizeAndParseJSON(jsonMatch[0]);
  }

  throw new Error("Nenhum provedor de IA disponível");
}

export interface AlertaIdentificacaoGerado {
  tipo: "nome_divergente" | "cpf_divergente" | "multiplos_nits" | "nome_mae_ausente";
  gravidade: "alta" | "media";
  mensagem: string;
}

export interface ValidacaoIdentificacaoResult {
  alertas: AlertaIdentificacaoGerado[];
  tudoOk: boolean;
  mensagemResumo: string;
}

function normalizarNome(nome: string | null | undefined): string {
  if (!nome) return "";
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compararNomes(nome1: string | null | undefined, nome2: string | null | undefined): boolean {
  const n1 = normalizarNome(nome1);
  const n2 = normalizarNome(nome2);
  
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  
  const palavras1 = n1.split(" ");
  const palavras2 = n2.split(" ");
  
  if (palavras1.length < 2 || palavras2.length < 2) return false;
  
  const primeiroNome1 = palavras1[0];
  const ultimoNome1 = palavras1[palavras1.length - 1];
  const primeiroNome2 = palavras2[0];
  const ultimoNome2 = palavras2[palavras2.length - 1];
  
  return primeiroNome1 === primeiroNome2 && ultimoNome1 === ultimoNome2;
}

function normalizarCpf(cpf: string | null | undefined): string {
  if (!cpf) return "";
  return cpf.replace(/[^\d]/g, "");
}

export function validarIdentificacao(
  identificacaoCnis: IdentificacaoExtraida | null | undefined,
  clienteNome: string,
  clienteCpf: string
): ValidacaoIdentificacaoResult {
  const alertas: AlertaIdentificacaoGerado[] = [];
  
  if (!identificacaoCnis) {
    return {
      alertas: [{
        tipo: "nome_divergente",
        gravidade: "alta",
        mensagem: "Dados de identificação não foram extraídos do CNIS."
      }],
      tudoOk: false,
      mensagemResumo: "Não foi possível validar a identificação."
    };
  }
  
  const cpfCnis = normalizarCpf(identificacaoCnis.cpf);
  const cpfCliente = normalizarCpf(clienteCpf);
  if (cpfCnis && cpfCliente && cpfCnis !== cpfCliente) {
    alertas.push({
      tipo: "cpf_divergente",
      gravidade: "alta",
      mensagem: `ATENÇÃO: CPF do CNIS (${identificacaoCnis.cpf}) difere do CPF cadastrado (${clienteCpf}). Verificar se é o documento correto.`
    });
  }
  
  const nomesConferem = compararNomes(identificacaoCnis.nomeCompleto, clienteNome);
  if (!nomesConferem && identificacaoCnis.nomeCompleto && clienteNome) {
    alertas.push({
      tipo: "nome_divergente",
      gravidade: "alta",
      mensagem: `ATENÇÃO: Nome do CNIS (${identificacaoCnis.nomeCompleto}) difere do nome cadastrado (${clienteNome}). Confirmar se é a mesma pessoa.`
    });
  }
  
  if (!identificacaoCnis.nomeMae || identificacaoCnis.nomeMae.trim() === "") {
    alertas.push({
      tipo: "nome_mae_ausente",
      gravidade: "media",
      mensagem: "Nome da mãe não consta no CNIS. Recomenda-se solicitar atualização para evitar problemas com homônimos."
    });
  }
  
  const nits = identificacaoCnis.nits || [];
  if (nits.length > 1) {
    alertas.push({
      tipo: "multiplos_nits",
      gravidade: "media",
      mensagem: `Atenção: Segurado possui ${nits.length} NITs (${nits.join(" e ")}). Verificar se todos estão no CNIS.`
    });
  }
  
  const tudoOk = alertas.length === 0;
  let mensagemResumo = "";
  
  if (tudoOk) {
    mensagemResumo = "Identificação validada. Nome e CPF conferem com o cadastro.";
  } else {
    const alertasAlta = alertas.filter(a => a.gravidade === "alta").length;
    const alertasMedia = alertas.filter(a => a.gravidade === "media").length;
    
    if (alertasAlta > 0) {
      mensagemResumo = `${alertasAlta} alerta(s) de alta gravidade encontrado(s). Ação necessária.`;
    } else {
      mensagemResumo = `${alertasMedia} alerta(s) de atenção encontrado(s). Recomenda-se verificação.`;
    }
  }
  
  return { alertas, tudoOk, mensagemResumo };
}
