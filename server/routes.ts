import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  insertCaseSchema,
  insertClientSchema,
  insertActivitySchema,
  insertCommentSchema,
  insertTagSchema,
  insertPipelineStageSchema,
  insertDealSchema,
  insertConversationSchema,
  insertMessageSchema,
} from "@shared/schema";
import planejamentoRoutes from "./routes/planejamento";
import whatsappRoutes from "./routes/whatsapp";

declare module 'express-session' {
  interface SessionData {
    loggedIn?: boolean;
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const MemStore = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dzamb-simple-session-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemStore({
      checkPeriod: 86400000
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }));
  
  app.use("/api/planejamento", planejamentoRoutes);
  app.use("/api/whatsapp", whatsappRoutes);
  
  app.post("/api/login", (req, res) => {
    req.session.loggedIn = true;
    req.session.user = {
      id: "1",
      email: "usuario@dzamb.com.br",
      name: "Usuário DZAMB",
      role: "admin"
    };
    req.session.save((err) => {
      if (err) {
        console.error("Erro ao salvar sessão:", err);
        return res.status(500).json({ error: "Erro ao fazer login" });
      }
      res.json({ success: true, user: req.session.user });
    });
  });
  
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Erro ao destruir sessão:", err);
        return res.status(500).json({ error: "Erro ao fazer logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
  
  app.get("/api/me", (req, res) => {
    if (req.session.loggedIn && req.session.user) {
      return res.json({
        authenticated: true,
        user: req.session.user,
      });
    }
    return res.json({ authenticated: false });
  });
  
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validated = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validated);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const validated = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validated);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/cases", async (req, res) => {
    try {
      const cases = await storage.getCases();
      res.json(cases);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/cases/:id", async (req, res) => {
    try {
      const caso = await storage.getCase(req.params.id);
      if (!caso) {
        return res.status(404).json({ message: "Caso não encontrado" });
      }
      res.json(caso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cases", async (req, res) => {
    try {
      const validated = insertCaseSchema.parse(req.body);
      const caso = await storage.createCase(validated);
      
      await storage.createActivity({
        caseId: caso.id,
        userId: "system",
        tipo: "criacao",
        descricao: `Caso criado: ${caso.titulo}`,
      });
      
      res.status(201).json(caso);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/cases/:id", async (req, res) => {
    try {
      const validated = insertCaseSchema.partial().parse(req.body);
      const caso = await storage.updateCase(req.params.id, validated);
      if (!caso) {
        return res.status(404).json({ message: "Caso não encontrado" });
      }
      
      await storage.createActivity({
        caseId: caso.id,
        userId: "system",
        tipo: "edicao",
        descricao: "Caso atualizado",
      });
      
      res.json(caso);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/cases/:id/activities", async (req, res) => {
    try {
      const activities = await storage.getCaseActivities(req.params.id);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cases/:id/activities", async (req, res) => {
    try {
      const validated = insertActivitySchema.omit({ caseId: true }).parse(req.body);
      const activity = await storage.createActivity({
        ...validated,
        caseId: req.params.id,
      });
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/cases/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCaseComments(req.params.id);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cases/:id/comments", async (req, res) => {
    try {
      const validated = insertCommentSchema.omit({ caseId: true }).parse(req.body);
      const comment = await storage.createComment({
        ...validated,
        caseId: req.params.id,
      });
      
      await storage.createActivity({
        caseId: req.params.id,
        userId: validated.userId,
        tipo: "comentario",
        descricao: validated.isInternal ? "Comentário interno adicionado" : "Comentário adicionado",
      });
      
      res.status(201).json(comment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tags", async (req, res) => {
    try {
      const validated = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validated);
      res.status(201).json(tag);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clients/:id/cases", async (req, res) => {
    try {
      const cases = await storage.getCasesByClient(req.params.id);
      res.json(cases);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/pipeline-stages", async (req, res) => {
    try {
      const stages = await storage.getPipelineStages();
      res.json(stages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/pipeline-stages", async (req, res) => {
    try {
      const validated = insertPipelineStageSchema.parse(req.body);
      const stage = await storage.createPipelineStage(validated);
      res.status(201).json(stage);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/pipeline-stages/:id", async (req, res) => {
    try {
      const validated = insertPipelineStageSchema.partial().parse(req.body);
      const stage = await storage.updatePipelineStage(req.params.id, validated);
      if (!stage) {
        return res.status(404).json({ message: "Etapa não encontrada" });
      }
      res.json(stage);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/pipeline-stages/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePipelineStage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Etapa não encontrada" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.getDeals();
      res.json(deals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deals/:id", async (req, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Oportunidade não encontrada" });
      }
      res.json(deal);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      const validated = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validated);
      res.status(201).json(deal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/deals/:id", async (req, res) => {
    try {
      const validated = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(req.params.id, validated);
      if (!deal) {
        return res.status(404).json({ message: "Oportunidade não encontrada" });
      }
      res.json(deal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/deals/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDeal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Oportunidade não encontrada" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      
      const enriched = await Promise.all(
        conversations.map(async (conv) => {
          const client = await storage.getClient(conv.clienteId);
          const messages = await storage.getMessages(conv.id);
          const unreadCount = messages.filter(m => !m.lida && m.remetenteTipo === "cliente").length;
          const lastMessage = messages[messages.length - 1];
          
          return {
            ...conv,
            clienteNome: client?.nome || "Cliente",
            ultimaMensagem: lastMessage?.conteudo || "",
            naoLidas: unreadCount,
          };
        })
      );
      
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }
      
      const client = await storage.getClient(conversation.clienteId);
      res.json({
        ...conversation,
        clienteNome: client?.nome || "Cliente",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const validated = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validated);
      res.status(201).json(conversation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      const validated = insertConversationSchema.partial().parse(req.body);
      const conversation = await storage.updateConversation(req.params.id, validated);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteConversation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const validated = insertMessageSchema.omit({ conversationId: true }).parse(req.body);
      const message = await storage.createMessage({
        ...validated,
        conversationId: req.params.id,
      });
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/conversations/:id/read", async (req, res) => {
    try {
      await storage.markMessagesAsRead(req.params.id);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        nomeCompleto: u.nomeCompleto,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
      }));
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
