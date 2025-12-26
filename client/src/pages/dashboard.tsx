import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, FileText, Brain, AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Planejamento } from "@shared/schema";

function getStatusBadge(status: string) {
  switch (status) {
    case "em_andamento":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Em Andamento</Badge>;
    case "aguardando_documentos":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Aguardando Docs</Badge>;
    case "concluido":
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Concluído</Badge>;
    default:
      return <Badge variant="outline">Rascunho</Badge>;
  }
}

function formatDate(dateString: string | Date | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
}

export default function Dashboard() {
  const { data: planejamentos, isLoading } = useQuery<Planejamento[]>({
    queryKey: ["/api/planejamento"],
  });

  const stats = {
    total: planejamentos?.length || 0,
    emAndamento: planejamentos?.filter(p => p.status === "em_andamento").length || 0,
    aguardandoDocs: planejamentos?.filter(p => p.status === "aguardando_documentos").length || 0,
    concluidos: planejamentos?.filter(p => p.status === "concluido").length || 0,
  };

  const recentPlanejamentos = planejamentos?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral dos seus planejamentos previdenciários
          </p>
        </div>
        <Link href="/planejamento/novo">
          <Button data-testid="button-new-planejamento" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Planejamento
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total de Planejamentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-500" data-testid="stat-em-andamento">{stats.emAndamento}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Aguardando Documentos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-500" data-testid="stat-aguardando">{stats.aguardandoDocs}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-500" data-testid="stat-concluidos">{stats.concluidos}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Planejamentos Recentes
            </CardTitle>
            <CardDescription>
              Últimos planejamentos criados ou atualizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentPlanejamentos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum planejamento encontrado</p>
                <Link href="/planejamento/novo">
                  <Button variant="outline" className="mt-4 gap-2" data-testid="button-create-first">
                    <Plus className="h-4 w-4" />
                    Criar primeiro planejamento
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPlanejamentos.map((p) => (
                  <Link key={p.id} href={`/planejamento/${p.id}`}>
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate cursor-pointer"
                      data-testid={`card-planejamento-${p.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.clienteNome}</p>
                        <p className="text-sm text-muted-foreground">
                          Criado em {formatDate(p.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(p.status)}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Trabalho</CardTitle>
            <CardDescription>
              Como funciona o planejamento previdenciário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Upload de Documentos</p>
                <p className="text-sm text-muted-foreground">
                  Envie CNIS, CTPS, PPP, FGTS e outros documentos do cliente
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Análise com IA</p>
                <p className="text-sm text-muted-foreground">
                  O sistema analisa cada vínculo, período e contribuição detalhadamente
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Detecção de Inconsistências</p>
                <p className="text-sm text-muted-foreground">
                  Cruzamento entre documentos para identificar divergências
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Lista de Pendências</p>
                <p className="text-sm text-muted-foreground">
                  Tópicos a serem resolvidos junto ao INSS
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                5
              </div>
              <div>
                <p className="font-medium">Geração do Parecer</p>
                <p className="text-sm text-muted-foreground">
                  Documento técnico completo com análise e recomendações
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
