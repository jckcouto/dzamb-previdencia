import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nomeCompleto: text("nome_completo").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("advogado"),
  avatar: text("avatar"),
  ativo: boolean("ativo").default(true).notNull(),
  ultimoAcesso: timestamp("ultimo_acesso"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  ultimoAcesso: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  cpf: text("cpf").notNull().unique(),
  dataNascimento: text("data_nascimento"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clients.id),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  status: text("status").notNull().default("Em Análise"),
  prioridade: text("prioridade").notNull().default("média"),
  tipoBeneficio: text("tipo_beneficio"),
  tags: text("tags").array(),
  documentosUpload: integer("documentos_upload").default(0),
  documentosAnalisados: integer("documentos_analisados").default(0),
  atribuidoA: varchar("atribuido_a").references(() => users.id),
  dataAbertura: timestamp("data_abertura").defaultNow().notNull(),
  dataUltimaAtualizacao: timestamp("data_ultima_atualizacao").defaultNow().notNull(),
  prazoEstimado: text("prazo_estimado"),
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  dataAbertura: true,
  dataUltimaAtualizacao: true,
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  tipo: text("tipo").notNull(),
  descricao: text("descricao").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: text("metadata"),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  conteudo: text("conteudo").notNull(),
  isInternal: boolean("is_internal").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  timestamp: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull().unique(),
  cor: text("cor").notNull(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export const pipelineStages = pgTable("pipeline_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  ordem: integer("ordem").notNull(),
  cor: text("cor").notNull(),
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({
  id: true,
});

export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type PipelineStage = typeof pipelineStages.$inferSelect;

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clients.id),
  titulo: text("titulo").notNull(),
  valor: integer("valor"),
  stageId: varchar("stage_id").notNull().references(() => pipelineStages.id),
  responsavelId: varchar("responsavel_id").references(() => users.id),
  descricao: text("descricao"),
  dataFechamento: timestamp("data_fechamento"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clients.id),
  atribuidoA: varchar("atribuido_a").references(() => users.id),
  canal: text("canal").notNull(),
  status: text("status").notNull().default("aberto"),
  ultimaMensagemAt: timestamp("ultima_mensagem_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  ultimaMensagemAt: true,
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  remetenteId: varchar("remetente_id").references(() => users.id),
  remetenteTipo: text("remetente_tipo").notNull(),
  conteudo: text("conteudo").notNull(),
  tipoMensagem: text("tipo_mensagem").notNull().default("text"),
  lida: boolean("lida").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  whatsappMessageId: text("whatsapp_message_id"),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const whatsappConnections = pgTable("whatsapp_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  phoneNumberId: text("phone_number_id"),
  accessToken: text("access_token"),
  qrCode: text("qr_code"),
  status: text("status").notNull().default("disconnected"),
  webhookUrl: text("webhook_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWhatsappConnectionSchema = createInsertSchema(whatsappConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWhatsappConnection = z.infer<typeof insertWhatsappConnectionSchema>;
export type WhatsappConnection = typeof whatsappConnections.$inferSelect;

export const planejamentos = pgTable("planejamentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  clienteNome: text("cliente_nome").notNull(),
  clienteCpf: text("cliente_cpf").notNull(),
  dadosExtraidos: text("dados_extraidos"),
  parecerGerado: text("parecer_gerado"),
  resumoAta: text("resumo_ata"),
  dadosCalculoExterno: jsonb("dados_calculo_externo"),
  resumoExecutivo: text("resumo_executivo"),
  status: text("status").notNull().default("uploaded"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlanejamentoSchema = createInsertSchema(planejamentos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlanejamento = z.infer<typeof insertPlanejamentoSchema>;
export type Planejamento = typeof planejamentos.$inferSelect;

export const documentosPlanejamento = pgTable("documentos_planejamento", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planejamentoId: varchar("planejamento_id").notNull().references(() => planejamentos.id),
  nomeArquivo: text("nome_arquivo").notNull(),
  tipoDocumento: text("tipo_documento").notNull(),
  arquivoUrl: text("arquivo_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentoPlanejamentoSchema = createInsertSchema(documentosPlanejamento).omit({
  id: true,
  createdAt: true,
});

export type InsertDocumentoPlanejamento = z.infer<typeof insertDocumentoPlanejamentoSchema>;
export type DocumentoPlanejamento = typeof documentosPlanejamento.$inferSelect;

export const vinculosCnis = pgTable("vinculos_cnis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planejamentoId: varchar("planejamento_id").notNull().references(() => planejamentos.id, { onDelete: "cascade" }),
  sequencia: integer("sequencia").notNull(),
  nit: text("nit"),
  empregador: text("empregador").notNull(),
  cnpjCpf: text("cnpj_cpf"),
  tipoVinculo: text("tipo_vinculo"),
  dataInicio: text("data_inicio"),
  dataFim: text("data_fim"),
  ultimaRemuneracao: text("ultima_remuneracao"),
  indicadores: text("indicadores").array(),
  observacoes: text("observacoes"),
  origemDocumento: text("origem_documento").notNull().default("CNIS"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVinculoCnisSchema = createInsertSchema(vinculosCnis).omit({
  id: true,
  createdAt: true,
});

export type InsertVinculoCnis = z.infer<typeof insertVinculoCnisSchema>;
export type VinculoCnis = typeof vinculosCnis.$inferSelect;

export const contribuicoesCnis = pgTable("contribuicoes_cnis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vinculoId: varchar("vinculo_id").notNull().references(() => vinculosCnis.id, { onDelete: "cascade" }),
  competencia: text("competencia").notNull(),
  remuneracao: text("remuneracao"),
  indicadores: text("indicadores").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContribuicaoCnisSchema = createInsertSchema(contribuicoesCnis).omit({
  id: true,
  createdAt: true,
});

export type InsertContribuicaoCnis = z.infer<typeof insertContribuicaoCnisSchema>;
export type ContribuicaoCnis = typeof contribuicoesCnis.$inferSelect;

export const inconsistencias = pgTable("inconsistencias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planejamentoId: varchar("planejamento_id").notNull().references(() => planejamentos.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  gravidade: text("gravidade").notNull().default("media"),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  documentoOrigem: text("documento_origem"),
  documentoComparacao: text("documento_comparacao"),
  vinculoId: varchar("vinculo_id").references(() => vinculosCnis.id),
  dadosOrigem: jsonb("dados_origem"),
  dadosComparacao: jsonb("dados_comparacao"),
  sugestaoCorrecao: text("sugestao_correcao"),
  status: text("status").notNull().default("pendente"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInconsistenciaSchema = createInsertSchema(inconsistencias).omit({
  id: true,
  createdAt: true,
});

export type InsertInconsistencia = z.infer<typeof insertInconsistenciaSchema>;
export type Inconsistencia = typeof inconsistencias.$inferSelect;

export const pendencias = pgTable("pendencias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planejamentoId: varchar("planejamento_id").notNull().references(() => planejamentos.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  tipo: text("tipo").notNull(),
  prioridade: text("prioridade").notNull().default("media"),
  acaoNecessaria: text("acao_necessaria"),
  documentosNecessarios: text("documentos_necessarios").array(),
  vinculoId: varchar("vinculo_id").references(() => vinculosCnis.id),
  inconsistenciaId: varchar("inconsistencia_id").references(() => inconsistencias.id),
  status: text("status").notNull().default("aberta"),
  observacoes: text("observacoes"),
  impactaCalculo: boolean("impacta_calculo").default(false),
  contexto: text("contexto"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvidaEm: timestamp("resolvida_em"),
});

export const insertPendenciaSchema = createInsertSchema(pendencias).omit({
  id: true,
  createdAt: true,
  resolvidaEm: true,
});

export type InsertPendencia = z.infer<typeof insertPendenciaSchema>;
export type Pendencia = typeof pendencias.$inferSelect;

export const analiseCompetencias = pgTable("analise_competencias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planejamentoId: varchar("planejamento_id").notNull(),
  vinculoId: varchar("vinculo_id").notNull(),
  vinculoSequencia: integer("vinculo_sequencia").notNull(),
  empregador: text("empregador").notNull(),
  mesesEsperados: integer("meses_esperados").notNull().default(0),
  mesesRegistrados: integer("meses_registrados").notNull().default(0),
  mesesFaltantes: text("meses_faltantes").array().notNull().default([]),
  impacto: text("impacto").notNull().default("baixo"),
  mensagem: text("mensagem"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnaliseCompetenciasSchema = createInsertSchema(analiseCompetencias).omit({
  id: true,
  createdAt: true,
});

export type InsertAnaliseCompetencias = z.infer<typeof insertAnaliseCompetenciasSchema>;
export type AnaliseCompetencias = typeof analiseCompetencias.$inferSelect;

export const problemasRemuneracao = pgTable("problemas_remuneracao", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planejamentoId: varchar("planejamento_id").notNull().references(() => planejamentos.id, { onDelete: "cascade" }),
  vinculoId: varchar("vinculo_id").notNull().references(() => vinculosCnis.id, { onDelete: "cascade" }),
  competencia: text("competencia").notNull(),
  valor: text("valor"),
  tipo: text("tipo").notNull(),
  gravidade: text("gravidade").notNull().default("media"),
  mensagem: text("mensagem").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProblemaRemuneracaoSchema = createInsertSchema(problemasRemuneracao).omit({
  id: true,
  createdAt: true,
});

export type InsertProblemaRemuneracao = z.infer<typeof insertProblemaRemuneracaoSchema>;
export type ProblemaRemuneracao = typeof problemasRemuneracao.$inferSelect;

export const identificacaoCnis = pgTable("identificacao_cnis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planejamentoId: varchar("planejamento_id").notNull().references(() => planejamentos.id, { onDelete: "cascade" }),
  nomeCompleto: text("nome_completo"),
  cpf: text("cpf"),
  nomeMae: text("nome_mae"),
  nits: text("nits").array(),
  dataNascimento: text("data_nascimento"),
  validada: boolean("validada").default(false),
  validadaPor: varchar("validada_por").references(() => users.id),
  validadaEm: timestamp("validada_em"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIdentificacaoCnisSchema = createInsertSchema(identificacaoCnis).omit({
  id: true,
  createdAt: true,
  validadaEm: true,
});

export type InsertIdentificacaoCnis = z.infer<typeof insertIdentificacaoCnisSchema>;
export type IdentificacaoCnis = typeof identificacaoCnis.$inferSelect;

export const alertasIdentificacao = pgTable("alertas_identificacao", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planejamentoId: varchar("planejamento_id").notNull().references(() => planejamentos.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  gravidade: text("gravidade").notNull().default("media"),
  mensagem: text("mensagem").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlertaIdentificacaoSchema = createInsertSchema(alertasIdentificacao).omit({
  id: true,
  createdAt: true,
});

export type InsertAlertaIdentificacao = z.infer<typeof insertAlertaIdentificacaoSchema>;
export type AlertaIdentificacao = typeof alertasIdentificacao.$inferSelect;

export const checklistValidacao = pgTable("checklist_validacao", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planejamentoId: varchar("planejamento_id").notNull().references(() => planejamentos.id, { onDelete: "cascade" }),
  identificacaoConfirmada: boolean("identificacao_confirmada").default(false),
  identificacaoConfirmadaEm: timestamp("identificacao_confirmada_em"),
  vinculosExtraidos: boolean("vinculos_extraidos").default(false),
  vinculosExtraidosEm: timestamp("vinculos_extraidos_em"),
  remuneracoesAnalisadas: boolean("remuneracoes_analisadas").default(false),
  remuneracoesAnalisadasEm: timestamp("remuneracoes_analisadas_em"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChecklistValidacaoSchema = createInsertSchema(checklistValidacao).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChecklistValidacao = z.infer<typeof insertChecklistValidacaoSchema>;
export type ChecklistValidacao = typeof checklistValidacao.$inferSelect;
