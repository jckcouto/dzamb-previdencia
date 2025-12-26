import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedPage } from "@/components/animated-page";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, 
  Paperclip, 
  Search,
  Phone,
  Check,
  CheckCheck,
  Plus,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client, Message } from "@shared/schema";

interface ConversationWithClient {
  id: string;
  clienteId: string;
  canal: string;
  status: string;
  ultimaMensagemAt: Date | null;
  createdAt: Date;
  clienteNome: string;
  ultimaMensagem: string;
  naoLidas: number;
}

export default function Chat() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewConvDialogOpen, setIsNewConvDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<ConversationWithClient[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
  });

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const createConversationMutation = useMutation({
    mutationFn: async (clienteId: string) => {
      const res = await apiRequest("POST", "/api/conversations", { 
        clienteId, 
        canal: "chat", 
        status: "aberto" 
      });
      return res.json() as Promise<ConversationWithClient>;
    },
    onSuccess: (newConv: ConversationWithClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(newConv.id);
      setIsNewConvDialogOpen(false);
      setSelectedClientId("");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (conteudo: string) => {
      const res = await apiRequest("POST", `/api/conversations/${selectedConversationId}/messages`, {
        conteudo,
        remetenteTipo: "advogado",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setMessageInput("");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await apiRequest("POST", `/api/conversations/${conversationId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      markAsReadMutation.mutate(selectedConversationId);
    }
  }, [selectedConversationId]);

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversationId) {
      sendMessageMutation.mutate(messageInput);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 60000) return "Agora";
    if (diff < 3600000) return `Há ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR");
  };

  const filteredConversations = conversations.filter(conv =>
    conv.clienteNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingConversations) {
    return (
      <AnimatedPage>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Chat ao Vivo</h1>
            <p className="text-muted-foreground mt-1">
              Atenda seus clientes em tempo real
            </p>
          </div>
          <Dialog open={isNewConvDialogOpen} onOpenChange={setIsNewConvDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-conversation">
                <Plus className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Iniciar Nova Conversa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Selecione o Cliente</label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger data-testid="select-conversation-client">
                      <SelectValue placeholder="Escolha um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNewConvDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => createConversationMutation.mutate(selectedClientId)}
                    disabled={!selectedClientId || createConversationMutation.isPending}
                    data-testid="button-start-conversation"
                  >
                    {createConversationMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Iniciar Conversa"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma conversa ainda</p>
            <Button onClick={() => setIsNewConvDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Iniciar Primeira Conversa
            </Button>
          </Card>
        ) : (
          <Card className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-12 h-full">
              {/* Conversations List */}
              <div className="col-span-4 border-r border-border flex flex-col">
                <CardHeader className="border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar conversas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-conversations"
                    />
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className={`p-3 rounded-md cursor-pointer hover-elevate ${
                          selectedConversationId === conv.id
                            ? "bg-primary/10 border border-primary/20"
                            : ""
                        }`}
                        data-testid={`conversation-${conv.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(conv.clienteNome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-semibold text-sm truncate">
                                {conv.clienteNome}
                              </p>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {conv.ultimaMensagemAt ? formatTime(conv.ultimaMensagemAt) : "Nova"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.ultimaMensagem || "Sem mensagens"}
                              </p>
                              {conv.naoLidas > 0 && (
                                <Badge
                                  variant="default"
                                  className="flex-shrink-0 h-5 min-w-5 px-1.5"
                                  data-testid={`badge-unread-${conv.id}`}
                                >
                                  {conv.naoLidas}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="col-span-8 flex flex-col">
                {selectedConversation ? (
                  <>
                    <CardHeader className="border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(selectedConversation.clienteNome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {selectedConversation.clienteNome}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {selectedConversation.canal === "whatsapp" ? "WhatsApp" : "Chat"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={selectedConversation.status === "aberto" ? "default" : "secondary"}>
                            {selectedConversation.status === "aberto" ? "Aberto" : "Fechado"}
                          </Badge>
                          <Button size="icon" variant="ghost">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.remetenteTipo === "advogado" ? "justify-end" : "justify-start"
                            }`}
                            data-testid={`message-${message.id}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                message.remetenteTipo === "advogado"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.conteudo}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {message.remetenteTipo === "advogado" && (
                                  message.lida ? (
                                    <CheckCheck className="h-3 w-3 opacity-70" />
                                  ) : (
                                    <Check className="h-3 w-3 opacity-70" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    <div className="p-4 border-t border-border">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                          placeholder="Digite sua mensagem..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1"
                          data-testid="input-message"
                        />
                        <Button 
                          size="icon" 
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || sendMessageMutation.isPending}
                          data-testid="button-send-message"
                        >
                          {sendMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Selecione uma conversa para começar
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </AnimatedPage>
  );
}
