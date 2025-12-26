import { 
  type User, type InsertUser,
  type Client, type InsertClient,
  type Case, type InsertCase,
  type Activity, type InsertActivity,
  type Comment, type InsertComment,
  type Tag, type InsertTag,
  type Planejamento, type InsertPlanejamento,
  type DocumentoPlanejamento, type InsertDocumentoPlanejamento,
  type PipelineStage, type InsertPipelineStage,
  type Deal, type InsertDeal,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type VinculoCnis, type InsertVinculoCnis,
  type ContribuicaoCnis, type InsertContribuicaoCnis,
  type Inconsistencia, type InsertInconsistencia,
  type Pendencia, type InsertPendencia,
  type AnaliseCompetencias, type InsertAnaliseCompetencias,
  type ProblemaRemuneracao, type InsertProblemaRemuneracao,
  type IdentificacaoCnis, type InsertIdentificacaoCnis,
  type AlertaIdentificacao, type InsertAlertaIdentificacao,
  type ChecklistValidacao, type InsertChecklistValidacao,
  analiseCompetencias as analiseCompetenciasTable,
  problemasRemuneracao as problemasRemuneracaoTable,
  identificacaoCnis as identificacaoCnisTable,
  alertasIdentificacao as alertasIdentificacaoTable,
  checklistValidacao as checklistValidacaoTable,
  vinculosCnis as vinculosCnisTable,
  contribuicoesCnis as contribuicoesCnisTable,
  planejamentos as planejamentosTable,
  documentosPlanejamento as documentosPlanejamentoTable,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getClient(id: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  getCase(id: string): Promise<Case | undefined>;
  getCases(): Promise<Case[]>;
  getCasesByClient(clientId: string): Promise<Case[]>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, caseData: Partial<InsertCase>): Promise<Case | undefined>;
  
  getCaseActivities(caseId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  getCaseComments(caseId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  getTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  
  getPlanejamento(id: string): Promise<Planejamento | undefined>;
  getPlanejamentos(userId?: string): Promise<Planejamento[]>;
  createPlanejamento(planejamento: InsertPlanejamento): Promise<Planejamento>;
  updatePlanejamento(id: string, planejamento: Partial<InsertPlanejamento>): Promise<Planejamento | undefined>;
  
  getDocumentosPlanejamento(planejamentoId: string): Promise<DocumentoPlanejamento[]>;
  createDocumentoPlanejamento(documento: InsertDocumentoPlanejamento): Promise<DocumentoPlanejamento>;

  // Pipeline Stages (CRM)
  getPipelineStages(): Promise<PipelineStage[]>;
  getPipelineStage(id: string): Promise<PipelineStage | undefined>;
  createPipelineStage(stage: InsertPipelineStage): Promise<PipelineStage>;
  updatePipelineStage(id: string, stage: Partial<InsertPipelineStage>): Promise<PipelineStage | undefined>;

  // Deals (CRM)
  getDeals(): Promise<Deal[]>;
  getDealsByStage(stageId: string): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: string): Promise<boolean>;

  // Conversations (Chat)
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationByClient(clientId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;

  // Messages (Chat)
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string): Promise<void>;

  // Vínculos CNIS
  getVinculosCnis(planejamentoId: string): Promise<VinculoCnis[]>;
  createVinculoCnis(vinculo: InsertVinculoCnis): Promise<VinculoCnis>;
  deleteVinculosCnisByPlanejamento(planejamentoId: string): Promise<void>;

  // Contribuições CNIS
  getContribuicoesCnis(vinculoId: string): Promise<ContribuicaoCnis[]>;
  createContribuicaoCnis(contribuicao: InsertContribuicaoCnis): Promise<ContribuicaoCnis>;
  deleteContribuicoesCnisByVinculo(vinculoId: string): Promise<void>;

  // Inconsistências
  getInconsistencias(planejamentoId: string): Promise<Inconsistencia[]>;
  createInconsistencia(inconsistencia: InsertInconsistencia): Promise<Inconsistencia>;
  updateInconsistencia(id: string, inconsistencia: Partial<InsertInconsistencia>): Promise<Inconsistencia | undefined>;

  // Pendências
  getPendencias(planejamentoId: string): Promise<Pendencia[]>;
  createPendencia(pendencia: InsertPendencia): Promise<Pendencia>;
  updatePendencia(id: string, pendencia: Partial<InsertPendencia>): Promise<Pendencia | undefined>;
  deletePendenciasByTipo(planejamentoId: string, tipo: string): Promise<void>;

  // Análise de Competências
  getAnaliseCompetencias(planejamentoId: string): Promise<AnaliseCompetencias[]>;
  createAnaliseCompetencia(analise: InsertAnaliseCompetencias): Promise<AnaliseCompetencias>;
  deleteAnaliseCompetenciasByPlanejamento(planejamentoId: string): Promise<void>;

  // Problemas de Remuneração
  getProblemasRemuneracao(planejamentoId: string): Promise<ProblemaRemuneracao[]>;
  getProblemasRemuneracaoByVinculo(vinculoId: string): Promise<ProblemaRemuneracao[]>;
  createProblemaRemuneracao(problema: InsertProblemaRemuneracao): Promise<ProblemaRemuneracao>;
  deleteProblemasRemuneracaoByPlanejamento(planejamentoId: string): Promise<void>;
  
  // Remunerações (contribuições) do planejamento
  getRemuneracoesByPlanejamento(planejamentoId: string): Promise<(ContribuicaoCnis & { empregador: string; vinculoSequencia: number })[]>;

  // Identificação CNIS
  getIdentificacaoCnis(planejamentoId: string): Promise<IdentificacaoCnis | undefined>;
  createIdentificacaoCnis(identificacao: InsertIdentificacaoCnis): Promise<IdentificacaoCnis>;
  updateIdentificacaoCnis(id: string, data: Partial<InsertIdentificacaoCnis>): Promise<IdentificacaoCnis | undefined>;
  deleteIdentificacaoCnisByPlanejamento(planejamentoId: string): Promise<void>;

  // Alertas de Identificação
  getAlertasIdentificacao(planejamentoId: string): Promise<AlertaIdentificacao[]>;
  createAlertaIdentificacao(alerta: InsertAlertaIdentificacao): Promise<AlertaIdentificacao>;
  deleteAlertasIdentificacaoByPlanejamento(planejamentoId: string): Promise<void>;

  // Checklist de Validação
  getChecklistValidacao(planejamentoId: string): Promise<ChecklistValidacao | undefined>;
  createChecklistValidacao(checklist: InsertChecklistValidacao): Promise<ChecklistValidacao>;
  updateChecklistValidacao(id: string, data: Partial<InsertChecklistValidacao>): Promise<ChecklistValidacao | undefined>;
  upsertChecklistValidacao(planejamentoId: string, data: Partial<InsertChecklistValidacao>): Promise<ChecklistValidacao>;

  // Vínculos - Observações
  updateVinculoObservacoes(vinculoId: string, observacoes: string): Promise<VinculoCnis | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private cases: Map<string, Case>;
  private activities: Map<string, Activity>;
  private comments: Map<string, Comment>;
  private tags: Map<string, Tag>;
  private planejamentos: Map<string, Planejamento>;
  private documentosPlanejamento: Map<string, DocumentoPlanejamento>;
  private pipelineStages: Map<string, PipelineStage>;
  private deals: Map<string, Deal>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private vinculosCnis: Map<string, VinculoCnis>;
  private contribuicoesCnis: Map<string, ContribuicaoCnis>;
  private inconsistencias: Map<string, Inconsistencia>;
  private pendencias: Map<string, Pendencia>;
  private analiseCompetencias: Map<string, AnaliseCompetencias>;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.cases = new Map();
    this.activities = new Map();
    this.comments = new Map();
    this.tags = new Map();
    this.planejamentos = new Map();
    this.documentosPlanejamento = new Map();
    this.pipelineStages = new Map();
    this.deals = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.vinculosCnis = new Map();
    this.contribuicoesCnis = new Map();
    this.inconsistencias = new Map();
    this.pendencias = new Map();
    this.analiseCompetencias = new Map();
    
    // Initialize default pipeline stages
    this.initializePipelineStages();
  }

  private initializePipelineStages() {
    const defaultStages: InsertPipelineStage[] = [
      { nome: "Lead", ordem: 1, cor: "#6B7280" },
      { nome: "Contato Inicial", ordem: 2, cor: "#3B82F6" },
      { nome: "Qualificação", ordem: 3, cor: "#8B5CF6" },
      { nome: "Proposta", ordem: 4, cor: "#F59E0B" },
      { nome: "Fechamento", ordem: 5, cor: "#10B981" },
    ];
    
    defaultStages.forEach(stage => {
      const id = randomUUID();
      this.pipelineStages.set(id, { id, ...stage });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      nomeCompleto: insertUser.nomeCompleto,
      email: insertUser.email,
      role: insertUser.role ?? "advogado",
      avatar: insertUser.avatar ?? null,
      ativo: insertUser.ativo ?? true,
      ultimoAcesso: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const now = new Date();
    const client: Client = {
      id,
      nome: insertClient.nome,
      email: insertClient.email,
      cpf: insertClient.cpf,
      telefone: insertClient.telefone ?? null,
      dataNascimento: insertClient.dataNascimento ?? null,
      avatar: insertClient.avatar ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updated: Client = {
      ...client,
      ...updates,
      updatedAt: new Date(),
    };
    this.clients.set(id, updated);
    return updated;
  }

  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getCases(): Promise<Case[]> {
    return Array.from(this.cases.values());
  }

  async createCase(insertCase: InsertCase): Promise<Case> {
    const id = randomUUID();
    const now = new Date();
    const caseData: Case = {
      id,
      status: insertCase.status ?? "Em Análise",
      clienteId: insertCase.clienteId,
      titulo: insertCase.titulo,
      descricao: insertCase.descricao ?? null,
      prioridade: insertCase.prioridade ?? "média",
      tipoBeneficio: insertCase.tipoBeneficio ?? null,
      tags: insertCase.tags ?? null,
      documentosUpload: insertCase.documentosUpload ?? null,
      documentosAnalisados: insertCase.documentosAnalisados ?? null,
      atribuidoA: insertCase.atribuidoA ?? null,
      dataAbertura: now,
      dataUltimaAtualizacao: now,
      prazoEstimado: insertCase.prazoEstimado ?? null,
    };
    this.cases.set(id, caseData);
    return caseData;
  }

  async updateCase(id: string, updates: Partial<InsertCase>): Promise<Case | undefined> {
    const caseData = this.cases.get(id);
    if (!caseData) return undefined;
    
    const updated: Case = {
      ...caseData,
      ...updates,
      dataUltimaAtualizacao: new Date(),
    };
    this.cases.set(id, updated);
    return updated;
  }

  async getCaseActivities(caseId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.caseId === caseId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      id,
      descricao: insertActivity.descricao,
      caseId: insertActivity.caseId,
      userId: insertActivity.userId,
      tipo: insertActivity.tipo,
      timestamp: new Date(),
      metadata: insertActivity.metadata ?? null,
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getCaseComments(caseId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.caseId === caseId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      id,
      caseId: insertComment.caseId,
      userId: insertComment.userId,
      timestamp: new Date(),
      conteudo: insertComment.conteudo,
      isInternal: insertComment.isInternal ?? null,
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = randomUUID();
    const tag: Tag = { ...insertTag, id };
    this.tags.set(id, tag);
    return tag;
  }

  async getPlanejamento(id: string): Promise<Planejamento | undefined> {
    const result = await db
      .select()
      .from(planejamentosTable)
      .where(eq(planejamentosTable.id, id));
    return result[0];
  }

  async getPlanejamentos(userId?: string): Promise<Planejamento[]> {
    if (userId) {
      return await db
        .select()
        .from(planejamentosTable)
        .where(eq(planejamentosTable.userId, userId));
    }
    return await db.select().from(planejamentosTable);
  }

  async createPlanejamento(insertPlanejamento: InsertPlanejamento): Promise<Planejamento> {
    const [planejamento] = await db
      .insert(planejamentosTable)
      .values({
        userId: insertPlanejamento.userId,
        clienteNome: insertPlanejamento.clienteNome,
        clienteCpf: insertPlanejamento.clienteCpf,
        dadosExtraidos: insertPlanejamento.dadosExtraidos ?? null,
        parecerGerado: insertPlanejamento.parecerGerado ?? null,
        resumoAta: insertPlanejamento.resumoAta ?? null,
        dadosCalculoExterno: insertPlanejamento.dadosCalculoExterno ?? null,
        resumoExecutivo: insertPlanejamento.resumoExecutivo ?? null,
        status: insertPlanejamento.status ?? "uploaded",
      })
      .returning();
    return planejamento;
  }

  async updatePlanejamento(id: string, updates: Partial<InsertPlanejamento>): Promise<Planejamento | undefined> {
    const [updated] = await db
      .update(planejamentosTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(planejamentosTable.id, id))
      .returning();
    return updated;
  }

  async getDocumentosPlanejamento(planejamentoId: string): Promise<DocumentoPlanejamento[]> {
    return await db
      .select()
      .from(documentosPlanejamentoTable)
      .where(eq(documentosPlanejamentoTable.planejamentoId, planejamentoId));
  }

  async createDocumentoPlanejamento(insertDocumento: InsertDocumentoPlanejamento): Promise<DocumentoPlanejamento> {
    const [documento] = await db
      .insert(documentosPlanejamentoTable)
      .values({
        planejamentoId: insertDocumento.planejamentoId,
        nomeArquivo: insertDocumento.nomeArquivo,
        tipoDocumento: insertDocumento.tipoDocumento,
        arquivoUrl: insertDocumento.arquivoUrl,
      })
      .returning();
    return documento;
  }

  // Additional User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Additional Client methods
  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Additional Case methods
  async getCasesByClient(clientId: string): Promise<Case[]> {
    return Array.from(this.cases.values())
      .filter(c => c.clienteId === clientId);
  }

  // Pipeline Stages (CRM)
  async getPipelineStages(): Promise<PipelineStage[]> {
    return Array.from(this.pipelineStages.values())
      .sort((a, b) => a.ordem - b.ordem);
  }

  async getPipelineStage(id: string): Promise<PipelineStage | undefined> {
    return this.pipelineStages.get(id);
  }

  async createPipelineStage(insertStage: InsertPipelineStage): Promise<PipelineStage> {
    const id = randomUUID();
    const stage: PipelineStage = { id, ...insertStage };
    this.pipelineStages.set(id, stage);
    return stage;
  }

  async updatePipelineStage(id: string, updates: Partial<InsertPipelineStage>): Promise<PipelineStage | undefined> {
    const stage = this.pipelineStages.get(id);
    if (!stage) return undefined;
    
    const updated: PipelineStage = { ...stage, ...updates };
    this.pipelineStages.set(id, updated);
    return updated;
  }

  async deletePipelineStage(id: string): Promise<boolean> {
    return this.pipelineStages.delete(id);
  }

  // Deals (CRM)
  async getDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values());
  }

  async getDealsByStage(stageId: string): Promise<Deal[]> {
    return Array.from(this.deals.values())
      .filter(d => d.stageId === stageId);
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = randomUUID();
    const now = new Date();
    const deal: Deal = {
      id,
      clienteId: insertDeal.clienteId,
      titulo: insertDeal.titulo,
      valor: insertDeal.valor ?? null,
      stageId: insertDeal.stageId,
      responsavelId: insertDeal.responsavelId ?? null,
      descricao: insertDeal.descricao ?? null,
      dataFechamento: insertDeal.dataFechamento ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.deals.set(id, deal);
    return deal;
  }

  async updateDeal(id: string, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const updated: Deal = {
      ...deal,
      ...updates,
      updatedAt: new Date(),
    };
    this.deals.set(id, updated);
    return updated;
  }

  async deleteDeal(id: string): Promise<boolean> {
    return this.deals.delete(id);
  }

  // Conversations (Chat)
  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => {
        const aTime = a.ultimaMensagemAt?.getTime() || a.createdAt.getTime();
        const bTime = b.ultimaMensagemAt?.getTime() || b.createdAt.getTime();
        return bTime - aTime;
      });
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationByClient(clientId: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values())
      .find(c => c.clienteId === clientId);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      id,
      clienteId: insertConversation.clienteId,
      atribuidoA: insertConversation.atribuidoA ?? null,
      canal: insertConversation.canal,
      status: insertConversation.status ?? "aberto",
      ultimaMensagemAt: null,
      createdAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated: Conversation = { ...conversation, ...updates };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: string): Promise<boolean> {
    // Also delete all messages in the conversation
    const messages = Array.from(this.messages.values()).filter(m => m.conversationId === id);
    messages.forEach(m => this.messages.delete(m.id));
    return this.conversations.delete(id);
  }

  // Messages (Chat)
  async getMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const now = new Date();
    const message: Message = {
      id,
      conversationId: insertMessage.conversationId,
      remetenteId: insertMessage.remetenteId ?? null,
      remetenteTipo: insertMessage.remetenteTipo,
      conteudo: insertMessage.conteudo,
      tipoMensagem: insertMessage.tipoMensagem ?? "text",
      lida: insertMessage.lida ?? false,
      timestamp: now,
      whatsappMessageId: insertMessage.whatsappMessageId ?? null,
    };
    this.messages.set(id, message);
    
    // Update conversation's last message timestamp
    const conversation = this.conversations.get(insertMessage.conversationId);
    if (conversation) {
      this.conversations.set(insertMessage.conversationId, {
        ...conversation,
        ultimaMensagemAt: now,
      });
    }
    
    return message;
  }

  async markMessagesAsRead(conversationId: string): Promise<void> {
    const messages = Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId && !m.lida);
    
    messages.forEach(m => {
      this.messages.set(m.id, { ...m, lida: true });
    });
  }

  // Vínculos CNIS
  async getVinculosCnis(planejamentoId: string): Promise<VinculoCnis[]> {
    return Array.from(this.vinculosCnis.values())
      .filter(v => v.planejamentoId === planejamentoId)
      .sort((a, b) => a.sequencia - b.sequencia);
  }

  async createVinculoCnis(insertVinculo: InsertVinculoCnis): Promise<VinculoCnis> {
    const id = randomUUID();
    const now = new Date();
    const vinculo: VinculoCnis = {
      id,
      planejamentoId: insertVinculo.planejamentoId,
      sequencia: insertVinculo.sequencia,
      nit: insertVinculo.nit ?? null,
      empregador: insertVinculo.empregador || `Vínculo ${insertVinculo.sequencia}`,
      cnpjCpf: insertVinculo.cnpjCpf ?? null,
      tipoVinculo: insertVinculo.tipoVinculo ?? null,
      dataInicio: insertVinculo.dataInicio ?? null,
      dataFim: insertVinculo.dataFim ?? null,
      ultimaRemuneracao: insertVinculo.ultimaRemuneracao ?? null,
      indicadores: insertVinculo.indicadores ?? [],
      observacoes: insertVinculo.observacoes ?? null,
      origemDocumento: insertVinculo.origemDocumento,
      createdAt: now,
    };
    this.vinculosCnis.set(id, vinculo);
    return vinculo;
  }

  // Contribuições CNIS
  async getContribuicoesCnis(vinculoId: string): Promise<ContribuicaoCnis[]> {
    return Array.from(this.contribuicoesCnis.values())
      .filter(c => c.vinculoId === vinculoId);
  }

  async createContribuicaoCnis(insertContribuicao: InsertContribuicaoCnis): Promise<ContribuicaoCnis> {
    const id = randomUUID();
    const contribuicao: ContribuicaoCnis = {
      id,
      vinculoId: insertContribuicao.vinculoId,
      competencia: insertContribuicao.competencia,
      remuneracao: insertContribuicao.remuneracao ?? null,
      indicadores: insertContribuicao.indicadores ?? [],
    };
    this.contribuicoesCnis.set(id, contribuicao);
    return contribuicao;
  }

  async deleteVinculosCnisByPlanejamento(planejamentoId: string): Promise<void> {
    // First, get all vínculos for this planejamento
    const vinculos = await this.getVinculosCnis(planejamentoId);
    
    // Delete all contribuições for each vínculo
    for (const vinculo of vinculos) {
      await this.deleteContribuicoesCnisByVinculo(vinculo.id);
    }
    
    // Delete all vínculos
    await db
      .delete(vinculosCnisTable)
      .where(eq(vinculosCnisTable.planejamentoId, planejamentoId));
  }

  async deleteContribuicoesCnisByVinculo(vinculoId: string): Promise<void> {
    await db
      .delete(contribuicoesCnisTable)
      .where(eq(contribuicoesCnisTable.vinculoId, vinculoId));
  }

  // Inconsistências
  async getInconsistencias(planejamentoId: string): Promise<Inconsistencia[]> {
    return Array.from(this.inconsistencias.values())
      .filter(i => i.planejamentoId === planejamentoId)
      .sort((a, b) => {
        const gravidadeOrdem = { critica: 0, alta: 1, media: 2, baixa: 3 };
        return (gravidadeOrdem[a.gravidade] || 4) - (gravidadeOrdem[b.gravidade] || 4);
      });
  }

  async createInconsistencia(insertInconsistencia: InsertInconsistencia): Promise<Inconsistencia> {
    const id = randomUUID();
    const now = new Date();
    const inconsistencia: Inconsistencia = {
      id,
      planejamentoId: insertInconsistencia.planejamentoId,
      tipo: insertInconsistencia.tipo,
      gravidade: insertInconsistencia.gravidade,
      titulo: insertInconsistencia.titulo,
      descricao: insertInconsistencia.descricao,
      documentoOrigem: insertInconsistencia.documentoOrigem,
      documentoComparacao: insertInconsistencia.documentoComparacao ?? null,
      vinculoId: insertInconsistencia.vinculoId ?? null,
      dadosOrigem: insertInconsistencia.dadosOrigem ?? null,
      dadosComparacao: insertInconsistencia.dadosComparacao ?? null,
      sugestaoCorrecao: insertInconsistencia.sugestaoCorrecao ?? null,
      status: insertInconsistencia.status ?? "pendente",
      createdAt: now,
    };
    this.inconsistencias.set(id, inconsistencia);
    return inconsistencia;
  }

  async updateInconsistencia(id: string, updates: Partial<InsertInconsistencia>): Promise<Inconsistencia | undefined> {
    const inconsistencia = this.inconsistencias.get(id);
    if (!inconsistencia) return undefined;
    
    const updated: Inconsistencia = { ...inconsistencia, ...updates };
    this.inconsistencias.set(id, updated);
    return updated;
  }

  // Pendências
  async getPendencias(planejamentoId: string): Promise<Pendencia[]> {
    return Array.from(this.pendencias.values())
      .filter(p => p.planejamentoId === planejamentoId)
      .sort((a, b) => {
        const prioridadeOrdem = { urgente: 0, alta: 1, media: 2, baixa: 3 };
        return (prioridadeOrdem[a.prioridade] || 4) - (prioridadeOrdem[b.prioridade] || 4);
      });
  }

  async createPendencia(insertPendencia: InsertPendencia): Promise<Pendencia> {
    const id = randomUUID();
    const now = new Date();
    const pendencia: Pendencia = {
      id,
      planejamentoId: insertPendencia.planejamentoId,
      titulo: insertPendencia.titulo,
      descricao: insertPendencia.descricao,
      tipo: insertPendencia.tipo,
      prioridade: insertPendencia.prioridade,
      acaoNecessaria: insertPendencia.acaoNecessaria ?? null,
      documentosNecessarios: insertPendencia.documentosNecessarios ?? [],
      vinculoId: insertPendencia.vinculoId ?? null,
      status: insertPendencia.status ?? "aberta",
      observacoes: insertPendencia.observacoes ?? null,
      resolvidaEm: null,
      createdAt: now,
    };
    this.pendencias.set(id, pendencia);
    return pendencia;
  }

  async updatePendencia(id: string, updates: Partial<InsertPendencia & { resolvidaEm?: Date }>): Promise<Pendencia | undefined> {
    const pendencia = this.pendencias.get(id);
    if (!pendencia) return undefined;
    
    const updated: Pendencia = { ...pendencia, ...updates };
    this.pendencias.set(id, updated);
    return updated;
  }

  async deletePendenciasByTipo(planejamentoId: string, tipo: string): Promise<void> {
    const toDelete = Array.from(this.pendencias.entries())
      .filter(([_, p]) => p.planejamentoId === planejamentoId && p.tipo === tipo)
      .map(([id]) => id);
    
    for (const id of toDelete) {
      this.pendencias.delete(id);
    }
  }

  // Análise de Competências - Using PostgreSQL persistence
  async getAnaliseCompetencias(planejamentoId: string): Promise<AnaliseCompetencias[]> {
    const result = await db
      .select()
      .from(analiseCompetenciasTable)
      .where(eq(analiseCompetenciasTable.planejamentoId, planejamentoId));
    return result;
  }

  async createAnaliseCompetencia(insertAnalise: InsertAnaliseCompetencias): Promise<AnaliseCompetencias> {
    const [analise] = await db
      .insert(analiseCompetenciasTable)
      .values({
        planejamentoId: insertAnalise.planejamentoId,
        vinculoId: insertAnalise.vinculoId,
        vinculoSequencia: insertAnalise.vinculoSequencia,
        empregador: insertAnalise.empregador || `Vínculo ${insertAnalise.vinculoSequencia}`,
        mesesEsperados: insertAnalise.mesesEsperados ?? 0,
        mesesRegistrados: insertAnalise.mesesRegistrados ?? 0,
        mesesFaltantes: insertAnalise.mesesFaltantes ?? [],
        impacto: insertAnalise.impacto ?? "baixo",
        mensagem: insertAnalise.mensagem ?? null,
      })
      .returning();
    return analise;
  }

  async deleteAnaliseCompetenciasByPlanejamento(planejamentoId: string): Promise<void> {
    await db
      .delete(analiseCompetenciasTable)
      .where(eq(analiseCompetenciasTable.planejamentoId, planejamentoId));
  }

  // Problemas de Remuneração - Using PostgreSQL persistence
  async getProblemasRemuneracao(planejamentoId: string): Promise<ProblemaRemuneracao[]> {
    const result = await db
      .select()
      .from(problemasRemuneracaoTable)
      .where(eq(problemasRemuneracaoTable.planejamentoId, planejamentoId));
    return result;
  }

  async getProblemasRemuneracaoByVinculo(vinculoId: string): Promise<ProblemaRemuneracao[]> {
    const result = await db
      .select()
      .from(problemasRemuneracaoTable)
      .where(eq(problemasRemuneracaoTable.vinculoId, vinculoId));
    return result;
  }

  async createProblemaRemuneracao(insertProblema: InsertProblemaRemuneracao): Promise<ProblemaRemuneracao> {
    const [problema] = await db
      .insert(problemasRemuneracaoTable)
      .values({
        planejamentoId: insertProblema.planejamentoId,
        vinculoId: insertProblema.vinculoId,
        competencia: insertProblema.competencia,
        valor: insertProblema.valor ?? null,
        tipo: insertProblema.tipo,
        gravidade: insertProblema.gravidade ?? "media",
        mensagem: insertProblema.mensagem,
      })
      .returning();
    return problema;
  }

  async deleteProblemasRemuneracaoByPlanejamento(planejamentoId: string): Promise<void> {
    await db
      .delete(problemasRemuneracaoTable)
      .where(eq(problemasRemuneracaoTable.planejamentoId, planejamentoId));
  }

  // Remunerações (contribuições) do planejamento com dados do vínculo
  async getRemuneracoesByPlanejamento(planejamentoId: string): Promise<(ContribuicaoCnis & { empregador: string; vinculoSequencia: number })[]> {
    const vinculos = await this.getVinculosCnis(planejamentoId);
    const result: (ContribuicaoCnis & { empregador: string; vinculoSequencia: number })[] = [];
    
    for (const vinculo of vinculos) {
      const contribuicoes = await this.getContribuicoesCnis(vinculo.id);
      for (const contrib of contribuicoes) {
        result.push({
          ...contrib,
          empregador: vinculo.empregador,
          vinculoSequencia: vinculo.sequencia,
        });
      }
    }
    
    return result;
  }

  // Identificação CNIS - Using PostgreSQL persistence
  async getIdentificacaoCnis(planejamentoId: string): Promise<IdentificacaoCnis | undefined> {
    const result = await db
      .select()
      .from(identificacaoCnisTable)
      .where(eq(identificacaoCnisTable.planejamentoId, planejamentoId));
    return result[0];
  }

  async createIdentificacaoCnis(insertIdentificacao: InsertIdentificacaoCnis): Promise<IdentificacaoCnis> {
    const [identificacao] = await db
      .insert(identificacaoCnisTable)
      .values({
        planejamentoId: insertIdentificacao.planejamentoId,
        nomeCompleto: insertIdentificacao.nomeCompleto ?? null,
        cpf: insertIdentificacao.cpf ?? null,
        nomeMae: insertIdentificacao.nomeMae ?? null,
        nits: insertIdentificacao.nits ?? null,
        dataNascimento: insertIdentificacao.dataNascimento ?? null,
        validada: insertIdentificacao.validada ?? false,
        validadaPor: insertIdentificacao.validadaPor ?? null,
      })
      .returning();
    return identificacao;
  }

  async updateIdentificacaoCnis(id: string, data: Partial<InsertIdentificacaoCnis>): Promise<IdentificacaoCnis | undefined> {
    const [updated] = await db
      .update(identificacaoCnisTable)
      .set(data)
      .where(eq(identificacaoCnisTable.id, id))
      .returning();
    return updated;
  }

  async deleteIdentificacaoCnisByPlanejamento(planejamentoId: string): Promise<void> {
    await db
      .delete(identificacaoCnisTable)
      .where(eq(identificacaoCnisTable.planejamentoId, planejamentoId));
  }

  // Alertas de Identificação - Using PostgreSQL persistence
  async getAlertasIdentificacao(planejamentoId: string): Promise<AlertaIdentificacao[]> {
    const result = await db
      .select()
      .from(alertasIdentificacaoTable)
      .where(eq(alertasIdentificacaoTable.planejamentoId, planejamentoId));
    return result;
  }

  async createAlertaIdentificacao(insertAlerta: InsertAlertaIdentificacao): Promise<AlertaIdentificacao> {
    const [alerta] = await db
      .insert(alertasIdentificacaoTable)
      .values({
        planejamentoId: insertAlerta.planejamentoId,
        tipo: insertAlerta.tipo,
        gravidade: insertAlerta.gravidade ?? "media",
        mensagem: insertAlerta.mensagem,
      })
      .returning();
    return alerta;
  }

  async deleteAlertasIdentificacaoByPlanejamento(planejamentoId: string): Promise<void> {
    await db
      .delete(alertasIdentificacaoTable)
      .where(eq(alertasIdentificacaoTable.planejamentoId, planejamentoId));
  }

  // Checklist de Validação - Using PostgreSQL persistence
  async getChecklistValidacao(planejamentoId: string): Promise<ChecklistValidacao | undefined> {
    const result = await db
      .select()
      .from(checklistValidacaoTable)
      .where(eq(checklistValidacaoTable.planejamentoId, planejamentoId));
    return result[0];
  }

  async createChecklistValidacao(insertChecklist: InsertChecklistValidacao): Promise<ChecklistValidacao> {
    const [checklist] = await db
      .insert(checklistValidacaoTable)
      .values({
        planejamentoId: insertChecklist.planejamentoId,
        identificacaoConfirmada: insertChecklist.identificacaoConfirmada ?? false,
        identificacaoConfirmadaEm: insertChecklist.identificacaoConfirmadaEm ?? null,
        vinculosExtraidos: insertChecklist.vinculosExtraidos ?? false,
        vinculosExtraidosEm: insertChecklist.vinculosExtraidosEm ?? null,
        remuneracoesAnalisadas: insertChecklist.remuneracoesAnalisadas ?? false,
        remuneracoesAnalisadasEm: insertChecklist.remuneracoesAnalisadasEm ?? null,
      })
      .returning();
    return checklist;
  }

  async updateChecklistValidacao(id: string, data: Partial<InsertChecklistValidacao>): Promise<ChecklistValidacao | undefined> {
    const [updated] = await db
      .update(checklistValidacaoTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(checklistValidacaoTable.id, id))
      .returning();
    return updated;
  }

  async upsertChecklistValidacao(planejamentoId: string, data: Partial<InsertChecklistValidacao>): Promise<ChecklistValidacao> {
    const existing = await this.getChecklistValidacao(planejamentoId);
    if (existing) {
      const updated = await this.updateChecklistValidacao(existing.id, data);
      return updated!;
    } else {
      return await this.createChecklistValidacao({
        planejamentoId,
        ...data,
      });
    }
  }

  // Vínculos - Observações
  async updateVinculoObservacoes(vinculoId: string, observacoes: string): Promise<VinculoCnis | undefined> {
    const [updated] = await db
      .update(vinculosCnisTable)
      .set({ observacoes })
      .where(eq(vinculosCnisTable.id, vinculoId))
      .returning();
    return updated;
  }
}

export const storage = new MemStorage();
