import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Clock, CheckCircle2, AlertCircle, Brain } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PlanejamentoStatus = "uploaded" | "processing" | "processed" | "parecer_gerado" | "error" | "arquivado";

interface Planejamento {
  id: string;
  userId: string;
  clienteNome: string;
  clienteCpf: string;
  status: PlanejamentoStatus;
  dadosExtraidos: any;
  parecerGerado: string | null;
  createdAt: string;
  documentos?: Array<{
    id: string;
    nomeArquivo: string;
    tipoDocumento: string;
  }>;
}

const statusConfig: Record<PlanejamentoStatus, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: any;
}> = {
  uploaded: {
    label: "Documentos Enviados",
    variant: "secondary",
    icon: FileText,
  },
  processing: {
    label: "Processando",
    variant: "default",
    icon: Clock,
  },
  processed: {
    label: "Dados Extraídos",
    variant: "outline",
    icon: Brain,
  },
  parecer_gerado: {
    label: "Parecer Gerado",
    variant: "default",
    icon: CheckCircle2,
  },
  error: {
    label: "Erro",
    variant: "destructive",
    icon: AlertCircle,
  },
  arquivado: {
    label: "Arquivado",
    variant: "secondary",
    icon: FileText,
  },
};

function PlanejamentoCard({ planejamento }: { planejamento: Planejamento }) {
  const config = statusConfig[planejamento.status] || {
    label: planejamento.status || "Desconhecido",
    variant: "outline" as const,
    icon: FileText,
  };
  const StatusIcon = config.icon;

  return (
    <Link href={`/planejamento/${planejamento.id}`}>
      <Card 
        className="hover-elevate active-elevate-2 cursor-pointer transition-all" 
        data-testid={`card-planejamento-${planejamento.id}`}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate" data-testid={`text-cliente-nome-${planejamento.id}`}>
                {planejamento.clienteNome}
              </CardTitle>
              <CardDescription className="mt-1" data-testid={`text-cliente-cpf-${planejamento.id}`}>
                CPF: {planejamento.clienteCpf}
              </CardDescription>
            </div>
            <Badge variant={config.variant} className="flex items-center gap-1.5 shrink-0" data-testid={`badge-status-${planejamento.id}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Documentos:</span>
              <span className="font-medium" data-testid={`text-doc-count-${planejamento.id}`}>
                {planejamento.documentos?.length || 0} arquivo(s)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Criado em:</span>
              <span className="font-medium" data-testid={`text-created-at-${planejamento.id}`}>
                {format(new Date(planejamento.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {planejamento.documentos && planejamento.documentos.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1.5">Arquivos:</p>
                <div className="flex flex-wrap gap-1.5">
                  {planejamento.documentos.slice(0, 3).map((doc) => (
                    <Badge key={doc.id} variant="outline" className="text-xs" data-testid={`badge-doc-${doc.id}`}>
                      {doc.nomeArquivo.length > 20 
                        ? `${doc.nomeArquivo.slice(0, 20)}...` 
                        : doc.nomeArquivo}
                    </Badge>
                  ))}
                  {planejamento.documentos.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{planejamento.documentos.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PlanejamentoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlanejamentoPage() {
  const { data: planejamentos, isLoading } = useQuery<Planejamento[]>({
    queryKey: ["/api/planejamento"],
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-planejamento">
              Planejamento Previdenciário
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-description">
              Análise automatizada de documentos com IA
            </p>
          </div>
          <Link href="/planejamento/novo">
            <Button size="default" className="gap-2" data-testid="button-novo-planejamento">
              <Plus className="w-4 h-4" />
              Novo Planejamento
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PlanejamentoSkeleton key={i} />
            ))}
          </div>
        ) : planejamentos && planejamentos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-planejamentos">
            {planejamentos.map((planejamento) => (
              <PlanejamentoCard key={planejamento.id} planejamento={planejamento} />
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold" data-testid="text-empty-title">
                  Nenhum planejamento encontrado
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-empty-description">
                  Comece criando um novo planejamento previdenciário. Envie documentos como CNIS, holerites e outros para análise automatizada.
                </p>
              </div>
              <Link href="/planejamento/novo" className="mt-4 inline-block">
                <Button className="gap-2" data-testid="button-criar-primeiro">
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Planejamento
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
