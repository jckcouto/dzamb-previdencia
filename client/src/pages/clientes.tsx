import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedPage, AnimatedList, AnimatedCard } from "@/components/animated-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Mail, Phone, Briefcase, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

const clientFormSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  cpf: z.string().min(11, "CPF inválido"),
  dataNascimento: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Cliente cadastrado",
        description: "O cliente foi adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      dataNascimento: "",
    },
  });

  const filteredClients = clients.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpf.includes(searchTerm)
  );

  const getInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const onSubmit = (data: ClientFormValues) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
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
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus clientes e seus dados cadastrais
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-client" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: João da Silva" 
                            {...field} 
                            data-testid="input-client-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="email@exemplo.com" 
                            {...field} 
                            data-testid="input-client-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            {...field} 
                            data-testid="input-client-cpf"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
                            {...field} 
                            data-testid="input-client-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dataNascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="DD/MM/AAAA" 
                            {...field} 
                            data-testid="input-client-birthdate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-client"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      data-testid="button-save-client"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar Cliente"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-client"
          />
        </div>

        {clients.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado</p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-first-client">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Cliente
            </Button>
          </Card>
        ) : (
          <AnimatedList staggerDelay={0.05}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((cliente, index) => (
                <AnimatedCard key={cliente.id} delay={index * 0.05}>
                  <Card 
                    className="hover-elevate active-elevate-2 cursor-pointer"
                    data-testid={`card-client-${cliente.id}`}
                  >
                    <CardHeader className="space-y-0 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={cliente.avatar || ""} alt={cliente.nome} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(cliente.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">
                              {cliente.nome}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              CPF: {cliente.cpf}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline"
                          className="shrink-0"
                          data-testid={`badge-client-${cliente.id}`}
                        >
                          Ativo
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                      {cliente.telefone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{cliente.telefone}</span>
                        </div>
                      )}
                      {cliente.dataNascimento && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span>Nascimento: {cliente.dataNascimento}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Cadastrado em:{" "}
                          {new Date(cliente.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              ))}
            </div>
          </AnimatedList>
        )}

        {filteredClients.length === 0 && clients.length > 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">Nenhum cliente encontrado com esse termo</p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
