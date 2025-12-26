import { z } from "zod";
import { PDFParse } from "pdf-parse";

export const dadosExtraidosSchema = z.object({
  nome: z.string().optional().default(""),
  cpf: z.string().optional().default(""),
  dataNascimento: z.string().nullable().optional().default(null),
  tempoContribuicao: z.object({
    anos: z.number().nullable().optional().default(0),
    meses: z.number().nullable().optional().default(0),
  }).optional().default({ anos: 0, meses: 0 }),
  vinculos: z.array(z.object({
    empresa: z.string().optional().default(""),
    inicio: z.string().optional().default(""),
    fim: z.string().nullable().optional().default(null),
    tipo: z.enum([
      "CLT", 
      "Autonomo", 
      "MEI", 
      "Contribuinte Individual", 
      "Facultativo", 
      "Empregado Doméstico", 
      "Segurado Especial", 
      "Outro"
    ]).optional().default("CLT"),
  })).optional().default([]),
  salarios: z.array(z.object({
    competencia: z.string().optional().default(""),
    valor: z.union([z.number(), z.string()]).transform(val => {
      if (typeof val === "string") {
        const num = parseFloat(val.replace(/[^\d.,-]/g, '').replace(',', '.'));
        return isNaN(num) ? 0 : num;
      }
      return val || 0;
    }).nullable().optional().default(0),
  })).optional().default([]),
  carencias: z.object({
    cumprida: z.boolean().nullable().optional().default(false),
    mesesContribuidos: z.number().nullable().optional().default(0),
  }).optional().default({ cumprida: false, mesesContribuidos: 0 }),
}).passthrough();

export type DadosExtraidos = z.infer<typeof dadosExtraidosSchema>;

export interface ContextoAdicional {
  resumoAta?: string;
  dadosCalculoExterno?: any;
}

export interface AIProvider {
  name: string;
  extractDataFromDocuments(pdfBase64List: string[]): Promise<DadosExtraidos>;
  generateParecer(dados: DadosExtraidos, contextoAdicional?: ContextoAdicional): Promise<string>;
}

const EXTRACTION_PROMPT = `Você é um especialista em direito previdenciário brasileiro.

TAREFA: Analise os documentos fornecidos (CNIS) e extraia as seguintes informações:

DADOS A EXTRAIR:
1. Nome completo do segurado
2. CPF (apenas números)
3. Data de nascimento (formato YYYY-MM-DD)
4. Tempo de contribuição total (em anos e meses)
5. Lista de vínculos empregatícios (empresa, período, tipo de vínculo)
6. Salários de contribuição (competências e valores)
7. Carências cumpridas

FORMATO DE SAÍDA: JSON estruturado EXATAMENTE neste formato:
{
  "nome": "Nome Completo do Segurado",
  "cpf": "12345678901",
  "dataNascimento": "1980-01-15",
  "tempoContribuicao": {
    "anos": 25,
    "meses": 6
  },
  "vinculos": [
    {
      "empresa": "Nome da Empresa LTDA",
      "inicio": "2010-01-01",
      "fim": "2020-12-31",
      "tipo": "CLT"
    }
  ],
  "salarios": [
    {
      "competencia": "2024-01",
      "valor": 3500.50
    }
  ],
  "carencias": {
    "cumprida": true,
    "mesesContribuidos": 180
  }
}

REGRAS IMPORTANTES:
1. Se um campo não estiver disponível no documento, use valores padrão:
   - Strings: use ""
   - Numbers: use 0
   - Booleans: use false
   - Arrays: use []
   - Objetos: use o objeto com valores padrão

2. O campo "tipo" em vínculos DEVE ser um destes valores:
   - "CLT"
   - "Autonomo"
   - "MEI"
   - "Contribuinte Individual"
   - "Facultativo"
   - "Empregado Doméstico"
   - "Segurado Especial"
   - "Outro"

3. Datas DEVEM estar no formato YYYY-MM-DD
4. Competências DEVEM estar no formato YYYY-MM
5. CPF DEVE conter apenas números (sem pontos ou traços)
6. Valores monetários DEVEM ser números (não strings)

7. SEMPRE retorne TODOS os campos do JSON, mesmo que vazios

Retorne SOMENTE o JSON, sem texto adicional, sem markdown, sem explicações.`;

const PARECER_GENERATION_PROMPT_TEMPLATE = (dados: DadosExtraidos, contextoAdicional?: ContextoAdicional) => {
  let contextoExtra = "";
  
  if (contextoAdicional?.resumoAta) {
    contextoExtra += `\n\nCONTEXTO ADICIONAL - RESUMO DA ATA DE REUNIÃO:
${contextoAdicional.resumoAta}`;
  }
  
  if (contextoAdicional?.dadosCalculoExterno) {
    contextoExtra += `\n\nCONTEXTO ADICIONAL - DADOS DE CÁLCULO EXTERNO:
${JSON.stringify(contextoAdicional.dadosCalculoExterno, null, 2)}`;
  }

  return `Você é um advogado previdenciário experiente.

DADOS DO CLIENTE:
${JSON.stringify(dados, null, 2)}${contextoExtra}

TAREFA: Gere um parecer técnico completo de planejamento previdenciário incluindo:

1. RESUMO EXECUTIVO
   - Situação atual do segurado
   - Principal recomendação

2. ANÁLISE DA SITUAÇÃO ATUAL
   - Tempo de contribuição
   - Idade
   - Carências

3. CENÁRIOS DE APOSENTADORIA
   Para cada regra aplicável calcule:
   - Regra de transição (se aplicável)
   - Aposentadoria por idade
   - Aposentadoria por tempo de contribuição
   - Regra de pontos
   
   Para cada cenário mostre:
   - Data estimada de elegibilidade
   - Tempo faltante
   - Valor estimado do benefício
   - Vantagens e desvantagens

4. RECOMENDAÇÃO ESTRATÉGICA
   - Melhor momento para requerer
   - Ações a tomar
   - Documentos que faltam

5. OBSERVAÇÕES E RESSALVAS

${contextoAdicional?.resumoAta ? '6. PONTOS DA REUNIÃO COM O CLIENTE\n   - Responder às dúvidas identificadas na ata\n   - Alinhar expectativas mencionadas\n\n' : ''}FORMATO: Markdown bem estruturado e profissional.
TOM: Técnico mas acessível ao cliente.`;
};

class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractDataFromDocuments(pdfBase64List: string[]): Promise<DadosExtraidos> {
    try {
      // Extrair texto de todos os PDFs usando pdf-parse v2
      const textosDocs: string[] = [];
      for (const base64 of pdfBase64List) {
        const buffer = Buffer.from(base64, "base64");
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        textosDocs.push(result.text);
      }
      
      const textoCompleto = textosDocs.join("\n\n--- PRÓXIMO DOCUMENTO ---\n\n");

      console.log("Chamando OpenAI API...");
      console.log("Modelo:", this.model);
      console.log("Tamanho do texto:", textoCompleto.length, "caracteres");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: EXTRACTION_PROMPT,
            },
            {
              role: "user",
              content: `Analise o seguinte documento e extraia as informações solicitadas:\n\n${textoCompleto}`,
            },
          ],
          max_completion_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });

      console.log("Status da resposta OpenAI:", response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("OpenAI API error (status " + response.status + "):", errorBody);
        throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      console.log("Resposta completa da OpenAI:", JSON.stringify(data, null, 2).substring(0, 2000));

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Estrutura de resposta inválida:", data);
        throw new Error("OpenAI retornou resposta em formato inválido");
      }

      const responseText = data.choices[0].message.content;
      console.log("Conteúdo da mensagem:", responseText ? responseText.substring(0, 500) : "(vazio)");

      if (!responseText || responseText.trim() === "") {
        console.error("Resposta vazia da OpenAI");
        throw new Error("OpenAI retornou resposta vazia. Verifique se o modelo está correto e se há créditos na conta.");
      }

      return this.parseExtractedData(responseText);
    } catch (error) {
      console.error("Erro completo ao extrair dados:", error);
      throw error;
    }
  }

  async generateParecer(dados: DadosExtraidos, contextoAdicional?: ContextoAdicional): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "user",
            content: PARECER_GENERATION_PROMPT_TEMPLATE(dados, contextoAdicional),
          },
        ],
        max_completion_tokens: 8000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseExtractedData(responseText: string): DadosExtraidos {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Resposta da IA não contém JSON:", responseText.substring(0, 500));
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Erro ao parsear JSON:", jsonMatch[0].substring(0, 500));
      throw new Error("JSON retornado pela IA é inválido");
    }

    console.log("JSON parseado com sucesso:", JSON.stringify(parsed, null, 2).substring(0, 1000));

    const validated = dadosExtraidosSchema.safeParse(parsed);
    
    if (!validated.success) {
      console.error("Erro de validação Zod:");
      console.error("Dados recebidos:", JSON.stringify(parsed, null, 2).substring(0, 1000));
      console.error("Erros de validação:", JSON.stringify(validated.error.errors, null, 2));
      throw new Error(`Dados extraídos não estão no formato esperado: ${validated.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    return validated.data;
  }
}

class ClaudeProvider implements AIProvider {
  name = "Claude (Anthropic)";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "claude-sonnet-4-20250514") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractDataFromDocuments(pdfBase64List: string[]): Promise<DadosExtraidos> {
    const documentContents = pdfBase64List.map(base64 => ({
      type: "document" as const,
      source: {
        type: "base64" as const,
        media_type: "application/pdf" as const,
        data: base64,
      },
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_completion_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              ...documentContents,
              { type: "text", text: EXTRACTION_PROMPT },
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

    return this.parseExtractedData(responseText);
  }

  async generateParecer(dados: DadosExtraidos, contextoAdicional?: ContextoAdicional): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_completion_tokens: 8000,
        messages: [
          {
            role: "user",
            content: PARECER_GENERATION_PROMPT_TEMPLATE(dados, contextoAdicional),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private parseExtractedData(responseText: string): DadosExtraidos {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Resposta da IA não contém JSON:", responseText.substring(0, 500));
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Erro ao parsear JSON:", jsonMatch[0].substring(0, 500));
      throw new Error("JSON retornado pela IA é inválido");
    }

    console.log("JSON parseado com sucesso:", JSON.stringify(parsed, null, 2).substring(0, 1000));

    const validated = dadosExtraidosSchema.safeParse(parsed);
    
    if (!validated.success) {
      console.error("Erro de validação Zod:");
      console.error("Dados recebidos:", JSON.stringify(parsed, null, 2).substring(0, 1000));
      console.error("Erros de validação:", JSON.stringify(validated.error.errors, null, 2));
      throw new Error(`Dados extraídos não estão no formato esperado: ${validated.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    return validated.data;
  }
}

class GeminiProvider implements AIProvider {
  name = "Gemini (Google)";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.0-flash-exp") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractDataFromDocuments(pdfBase64List: string[]): Promise<DadosExtraidos> {
    const parts = pdfBase64List.map(base64 => ({
      inline_data: {
        mime_type: "application/pdf",
        data: base64,
      },
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                ...parts,
                { text: EXTRACTION_PROMPT },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;

    return this.parseExtractedData(responseText);
  }

  async generateParecer(dados: DadosExtraidos, contextoAdicional?: ContextoAdicional): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PARECER_GENERATION_PROMPT_TEMPLATE(dados, contextoAdicional) },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private parseExtractedData(responseText: string): DadosExtraidos {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Resposta da IA não contém JSON:", responseText.substring(0, 500));
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Erro ao parsear JSON:", jsonMatch[0].substring(0, 500));
      throw new Error("JSON retornado pela IA é inválido");
    }

    console.log("JSON parseado com sucesso:", JSON.stringify(parsed, null, 2).substring(0, 1000));

    const validated = dadosExtraidosSchema.safeParse(parsed);
    
    if (!validated.success) {
      console.error("Erro de validação Zod:");
      console.error("Dados recebidos:", JSON.stringify(parsed, null, 2).substring(0, 1000));
      console.error("Erros de validação:", JSON.stringify(validated.error.errors, null, 2));
      throw new Error(`Dados extraídos não estão no formato esperado: ${validated.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    return validated.data;
  }
}

class DeepSeekProvider implements AIProvider {
  name = "DeepSeek";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "deepseek-chat") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractDataFromDocuments(pdfBase64List: string[]): Promise<DadosExtraidos> {
    const content = pdfBase64List.map(base64 => ({
      type: "image_url" as const,
      image_url: {
        url: `data:application/pdf;base64,${base64}`,
      },
    }));

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "user",
            content: [
              ...content,
              { type: "text", text: EXTRACTION_PROMPT },
            ],
          },
        ],
        max_completion_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;

    return this.parseExtractedData(responseText);
  }

  async generateParecer(dados: DadosExtraidos, contextoAdicional?: ContextoAdicional): Promise<string> {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "user",
            content: PARECER_GENERATION_PROMPT_TEMPLATE(dados, contextoAdicional),
          },
        ],
        max_completion_tokens: 8000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseExtractedData(responseText: string): DadosExtraidos {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Resposta da IA não contém JSON:", responseText.substring(0, 500));
      throw new Error("Não foi possível extrair JSON da resposta da IA");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Erro ao parsear JSON:", jsonMatch[0].substring(0, 500));
      throw new Error("JSON retornado pela IA é inválido");
    }

    console.log("JSON parseado com sucesso:", JSON.stringify(parsed, null, 2).substring(0, 1000));

    const validated = dadosExtraidosSchema.safeParse(parsed);
    
    if (!validated.success) {
      console.error("Erro de validação Zod:");
      console.error("Dados recebidos:", JSON.stringify(parsed, null, 2).substring(0, 1000));
      console.error("Erros de validação:", JSON.stringify(validated.error.errors, null, 2));
      throw new Error(`Dados extraídos não estão no formato esperado: ${validated.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    return validated.data;
  }
}

export function createAIProvider(provider: string): AIProvider {
  const providerLower = provider.toLowerCase();

  switch (providerLower) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY não configurada");
      }
      return new OpenAIProvider(process.env.OPENAI_API_KEY);

    case "claude":
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY não configurada");
      }
      return new ClaudeProvider(process.env.ANTHROPIC_API_KEY);

    case "gemini":
    case "google":
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY não configurada");
      }
      return new GeminiProvider(process.env.GEMINI_API_KEY);

    case "deepseek":
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error("DEEPSEEK_API_KEY não configurada");
      }
      return new DeepSeekProvider(process.env.DEEPSEEK_API_KEY);

    default:
      throw new Error(`Provedor de IA não suportado: ${provider}. Opções: openai, claude, gemini, deepseek`);
  }
}

export function getConfiguredProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "openai";
  return createAIProvider(provider);
}
