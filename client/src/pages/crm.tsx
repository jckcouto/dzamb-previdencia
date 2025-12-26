import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedPage } from "@/components/animated-page";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, TrendingUp, DollarSign, Users, Target, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PipelineStage, Deal, Client } from "@shared/schema";

const dealFormSchema = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  clienteId: z.string().min(1, "Selecione um cliente"),
  valor: z.number().min(0, "Valor deve ser positivo").optional(),
  stageId: z.string().min(1, "Selecione uma etapa"),
  descricao: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

export default function CRM() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: stages = [], isLoading: loadingStages } = useQuery<PipelineStage[]>({
    queryKey: ["/api/pipeline-stages"],
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: DealFormValues) => {
      const res = await apiRequest("POST", "/api/deals", {
        ...data,
        valor: data.valor || 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Oportunidade criada",
        description: "A oportunidade foi adicionada ao pipeline.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const res = await apiRequest("PATCH", `/api/deals/${dealId}`, { stageId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
    },
  });

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      titulo: "",
      clienteId: "",
      valor: 0,
      stageId: stages[0]?.id || "",
      descricao: "",
    },
  });

  const getDealsByStage = (stageId: string) => {
    return deals.filter(d => d.stageId === stageId);
  };

  const getClientName = (clienteId: string) => {
    const client = clients.find(c => c.id === clienteId);
    return client?.nome || "Cliente";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const totalValue = deals.reduce((sum, deal) => sum + (deal.valor || 0), 0);
  const totalDeals = deals.length;

  const onSubmit = (data: DealFormValues) => {
    createMutation.mutate(data);
  };

  const isLoading = loadingStages || loadingDeals;

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
            <h1 className="text-3xl font-bold">CRM - Pipeline de Vendas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas oportunidades e conversões
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-deal">
                <Plus className="h-4 w-4 mr-2" />
                Nova Oportunidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Oportunidade</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Revisão de Aposentadoria" 
                            {...field} 
                            data-testid="input-deal-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clienteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deal-client">
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                            data-testid="input-deal-value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etapa</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deal-stage">
                              <SelectValue placeholder="Selecione a etapa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stages.map(stage => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      data-testid="button-save-deal"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Criar Oportunidade"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover-elevate" data-testid="stat-card-total-value">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(totalValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Em {totalDeals} oportunidades
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="stat-card-conversion">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalDeals > 0 
                  ? Math.round((getDealsByStage(stages[stages.length - 1]?.id || "").length / totalDeals) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Fechamentos realizados
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="stat-card-active-deals">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Oportunidades Ativas</CardTitle>
              <Target className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                No pipeline atual
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="stat-card-clients">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clientes cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {clients.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Cadastre clientes antes de criar oportunidades
            </p>
            <Button onClick={() => window.location.href = "/clientes"}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Cliente
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" data-testid="kanban-board">
            {stages.map((stage) => (
              <div key={stage.id} className="space-y-3" data-testid={`stage-${stage.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.cor }}
                    />
                    <h3 className="font-semibold">{stage.nome}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs" data-testid={`stage-count-${stage.id}`}>
                    {getDealsByStage(stage.id).length}
                  </Badge>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {getDealsByStage(stage.id).map((deal) => (
                    <Card
                      key={deal.id}
                      className="hover-elevate cursor-pointer"
                      data-testid={`deal-card-${deal.id}`}
                    >
                      <CardHeader className="p-3 space-y-2">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {deal.titulo}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {getClientName(deal.clienteId)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-success">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                            }).format(deal.valor || 0)}
                          </span>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(getClientName(deal.clienteId))}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {getDealsByStage(stage.id).length === 0 && (
                    <div className="p-4 border-2 border-dashed rounded-md text-center">
                      <p className="text-xs text-muted-foreground">
                        Nenhuma oportunidade
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
