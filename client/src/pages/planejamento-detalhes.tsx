import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Brain, FileText, Sparkles, Download, Save, 
  FileUp, ClipboardList, Calculator, FileSpreadsheet, 
  Loader2, CheckCircle2, AlertCircle, Building2, AlertTriangle,
  ListChecks, Upload, Clock, ChevronDown, ChevronUp, Trash2, Pencil, RefreshCw
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PlanejamentoStatus = "uploaded" | "processing" | "processed" | "parecer_gerado" | "error" | "arquivado";

interface Documento {
  id: string;
  nomeArquivo: string;
  tipoDocumento: string;
  arquivoUrl: string;
}

interface Planejamento {
  id: string;
  userId: string;
  clienteNome: string;
  clienteCpf: string;
  status: PlanejamentoStatus;
  dadosExtraidos: any;
  parecerGerado: string | null;
  resumoAta: string | null;
  dadosCalculoExterno: string | null;
  resumoExecutivo: string | null;
  createdAt: string;
  documentos: Documento[];
}

interface VinculoCnis {
  id: string;
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
  contribuicoes?: ContribuicaoCnis[];
}

interface ContribuicaoCnis {
  id: string;
  competencia: string;
  remuneracao?: string;
  indicadores?: string[];
}

interface Inconsistencia {
  id: string;
  tipo: string;
  gravidade: "baixa" | "media" | "alta" | "critica";
  titulo: string;
  descricao: string;
  documentoOrigem: string;
  documentoComparacao?: string;
  sugestaoCorrecao?: string;
  status: string;
}

interface Pendencia {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: "baixa" | "media" | "alta" | "urgente";
  acaoNecessaria?: string;
  documentosNecessarios?: string[];
  status: string;
  observacoes?: string;
  resolvidaEm?: string;
  impactaCalculo?: boolean;
  contexto?: string;
}

interface AnaliseCompetencia {
  vinculoId: string;
  vinculoSequencia: number;
  empregador: string;
  mesesEsperados: number;
  mesesRegistrados: number;
  mesesFaltantes: string[];
  impacto: "baixo" | "alto";
  mensagem: string;
}

interface IdentificacaoCnis {
  id: string;
  planejamentoId: string;
  nomeCompleto?: string;
  cpf?: string;
  nomeMae?: string;
  dataNascimento?: string;
  nits: string[];
  validada: boolean;
}

interface AlertaIdentificacao {
  id: string;
  planejamentoId: string;
  tipo: "nome_divergente" | "cpf_divergente" | "multiplos_nits" | "nome_mae_ausente";
  gravidade: "alta" | "media";
  mensagem: string;
}

interface ChecklistValidacao {
  id: string;
  planejamentoId: string;
  identificacaoConfirmada: boolean;
  identificacaoConfirmadaEm: string | null;
  vinculosExtraidos: boolean;
  vinculosExtraidosEm: string | null;
  remuneracoesAnalisadas: boolean;
  remuneracoesAnalisadasEm: string | null;
}

interface AnaliseCompetenciasResponse {
  analises: AnaliseCompetencia[];
  resumo: {
    totalVinculos: number;
    vinculosComFaltas: number;
    vinculosAltoImpacto: number;
    totalMesesFaltantes: number;
  };
}

interface ProblemaRemuneracao {
  id: string;
  planejamentoId: string;
  vinculoId: string;
  competencia: string;
  valor: string | null;
  tipo: "zerada" | "muito_baixa" | "ausente";
  gravidade: "alta" | "media";
  mensagem: string;
}

export default function PlanejamentoDetalhesPage() {
  const [, params] = useRoute("/planejamento/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editedParecer, setEditedParecer] = useState<string>("");
  const [textoAta, setTextoAta] = useState<string>("");
  const [vinculoExpandido, setVinculoExpandido] = useState<string | null>(null);
  const [observacoesEditando, setObservacoesEditando] = useState<Record<string, string>>({});
  const calculoFileRef = useRef<HTMLInputElement>(null);
  const cruzarDocFileRef = useRef<HTMLInputElement>(null);
  const [tipoDocCruzar, setTipoDocCruzar] = useState<string>("CTPS");
  const [editarClienteOpen, setEditarClienteOpen] = useState(false);
  const [editClienteNome, setEditClienteNome] = useState("");
  const [editClienteCpf, setEditClienteCpf] = useState("");

  const { data: planejamento, isLoading } = useQuery<Planejamento>({
    queryKey: ["/api/planejamento", params?.id],
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { 
    data: vinculos = [], 
    isLoading: vinculosLoading, 
    isError: vinculosError,
    refetch: refetchVinculos
  } = useQuery<VinculoCnis[]>({
    queryKey: ["/api/planejamento", params?.id, "vinculos"],
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos - mantém dados ao trocar de aba
  });

  const { 
    data: inconsistencias = [], 
    isLoading: inconsistenciasLoading, 
    isError: inconsistenciasError 
  } = useQuery<Inconsistencia[]>({
    queryKey: ["/api/planejamento", params?.id, "inconsistencias"],
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: pendencias = [], 
    isLoading: pendenciasLoading, 
    isError: pendenciasError 
  } = useQuery<Pendencia[]>({
    queryKey: ["/api/planejamento", params?.id, "pendencias"],
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: analiseCompetencias,
    isLoading: competenciasLoading,
    refetch: refetchCompetencias
  } = useQuery<AnaliseCompetenciasResponse>({
    queryKey: ["/api/planejamento", params?.id, "competencias"],
    enabled: !!params?.id && vinculos.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: problemasRemuneracao = [],
    isLoading: problemasLoading,
    refetch: refetchProblemas
  } = useQuery<ProblemaRemuneracao[]>({
    queryKey: ["/api/planejamento", params?.id, "problemas-remuneracao"],
    enabled: !!params?.id && vinculos.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: identificacao,
    isLoading: identificacaoLoading
  } = useQuery<IdentificacaoCnis | null>({
    queryKey: ["/api/planejamento", params?.id, "identificacao"],
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: alertasIdentificacao = [],
    isLoading: alertasIdentificacaoLoading
  } = useQuery<AlertaIdentificacao[]>({
    queryKey: ["/api/planejamento", params?.id, "alertas-identificacao"],
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: checklist,
    isLoading: checklistLoading
  } = useQuery<ChecklistValidacao | null>({
    queryKey: ["/api/planejamento", params?.id, "checklist"],
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Inicializa o parecer editado quando carregar
  useEffect(() => {
    if (planejamento?.parecerGerado && !editedParecer) {
      setEditedParecer(planejamento.parecerGerado);
    }
  }, [planejamento?.parecerGerado]);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    if (!planejamento) return;
    
    try {
      setIsDownloadingPdf(true);
      
      const response = await fetch(`/api/planejamento/${planejamento.id}/resumo/pdf`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao gerar PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumo_${planejamento.clienteNome.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado.",
      });
    } catch (error: any) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const excluirMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/planejamento/${params?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento"] });
      toast({
        title: "Planejamento excluído",
        description: "O planejamento foi removido com sucesso.",
      });
      setLocation("/planejamento");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const atualizarClienteMutation = useMutation({
    mutationFn: async ({ clienteNome, clienteCpf }: { clienteNome: string; clienteCpf: string }) => {
      return apiRequest("PATCH", `/api/planejamento/${params?.id}`, {
        clienteNome,
        clienteCpf,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "alertas-identificacao"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "pendencias"] });
      setEditarClienteOpen(false);
      toast({
        title: "Dados atualizados",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const usarDadosCnisMutation = useMutation({
    mutationFn: async () => {
      if (!identificacao) throw new Error("Dados do CNIS não disponíveis");
      return apiRequest("PATCH", `/api/planejamento/${params?.id}`, {
        clienteNome: identificacao.nomeCompleto || planejamento?.clienteNome,
        clienteCpf: identificacao.cpf || planejamento?.clienteCpf,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "alertas-identificacao"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "pendencias"] });
      toast({
        title: "Dados atualizados",
        description: "Os dados do cliente foram atualizados com os dados do CNIS.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ pilar, valor }: { pilar: string; valor: boolean }) => {
      return apiRequest("POST", `/api/planejamento/${params?.id}/checklist`, {
        pilar,
        valor,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "checklist"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar checklist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateObservacoesMutation = useMutation({
    mutationFn: async ({ vinculoId, observacoes }: { vinculoId: string; observacoes: string }) => {
      return apiRequest("PUT", `/api/planejamento/${params?.id}/vinculos/${vinculoId}/observacoes`, {
        observacoes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "vinculos"] });
      toast({
        title: "Observações salvas",
        description: "As observações foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar observações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const processarMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/planejamento/processar", {
        planejamentoId: params?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id] });
      toast({
        title: "Processamento iniciado",
        description: "Os documentos estão sendo analisados pela IA.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const gerarParecerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/planejamento/gerar-parecer", {
        planejamentoId: params?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id] });
      toast({
        title: "Parecer gerado com sucesso",
        description: "O parecer técnico foi criado pela IA.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar parecer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const salvarParecerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/planejamento/${params?.id}`, {
        parecerGerado: editedParecer,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id] });
      toast({
        title: "Parecer salvo",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const analisarAtaMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/planejamento/${params?.id}/analisar-ata`, {
        textoAta,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id] });
      setTextoAta("");
      toast({
        title: "Ata analisada",
        description: "A ata foi analisada e o resumo foi salvo com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao analisar ata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importarCalculoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("relatorio", file);
      
      const response = await fetch(`/api/planejamento/${params?.id}/importar-calculo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao importar cálculo");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id] });
      if (calculoFileRef.current) {
        calculoFileRef.current.value = "";
      }
      toast({
        title: "Cálculo importado",
        description: "Os dados do relatório de cálculo foram importados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao importar cálculo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const gerarResumoMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/planejamento/${params?.id}/resumo-executivo`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id] });
      toast({
        title: "Resumo gerado",
        description: "O resumo executivo foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar resumo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const analisarCnisMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/planejamento/${params?.id}/analisar-cnis`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "vinculos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "pendencias"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "competencias"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "problemas-remuneracao"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "identificacao"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "alertas-identificacao"] });
      toast({
        title: "CNIS analisado",
        description: "Os vínculos foram extraídos com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao analisar CNIS",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cruzarDocumentoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("documento", file);
      formData.append("tipoDocumento", tipoDocCruzar);
      
      const response = await fetch(`/api/planejamento/${params?.id}/cruzar-documento`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao cruzar documento");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "inconsistencias"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "pendencias"] });
      if (cruzarDocFileRef.current) {
        cruzarDocFileRef.current.value = "";
      }
      toast({
        title: "Documento cruzado",
        description: `${data.inconsistencias || 0} inconsistência(s) e ${data.pendencias || 0} pendência(s) detectadas.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cruzar documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const atualizarPendenciaMutation = useMutation({
    mutationFn: async ({ pendenciaId, status }: { pendenciaId: string; status: string }) => {
      return apiRequest("PATCH", `/api/planejamento/${params?.id}/pendencias/${pendenciaId}`, {
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento", params?.id, "pendencias"] });
      toast({
        title: "Pendência atualizada",
        description: "O status da pendência foi alterado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar pendência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCruzarDocumento = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      cruzarDocumentoMutation.mutate(file);
    }
  };

  const getGravidadeBadge = (gravidade: string) => {
    const variants: Record<string, "destructive" | "secondary" | "outline" | "default"> = {
      critica: "destructive",
      alta: "destructive",
      media: "secondary",
      baixa: "outline",
    };
    return variants[gravidade] || "outline";
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const variants: Record<string, "destructive" | "secondary" | "outline" | "default"> = {
      urgente: "destructive",
      alta: "destructive",
      media: "secondary",
      baixa: "outline",
    };
    return variants[prioridade] || "outline";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!planejamento) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Planejamento não encontrado</h2>
              <Link href="/planejamento">
                <Button variant="outline">Voltar para lista</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const handleParecer = () => {
    if (editedParecer && editedParecer !== planejamento.parecerGerado) {
      setEditedParecer(planejamento.parecerGerado || "");
    }
  };

  const handleCalculoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importarCalculoMutation.mutate(file);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/planejamento">
            <Button variant="ghost" size="icon" data-testid="button-voltar">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold" data-testid="heading-planejamento">
              {planejamento.clienteNome}
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-cpf">
              CPF: {planejamento.clienteCpf}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={planejamento.status === "parecer_gerado" ? "default" : "secondary"}
              className="text-sm"
              data-testid="badge-status"
            >
              {planejamento.status === "uploaded" && "Documentos Enviados"}
              {planejamento.status === "processing" && (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processando...
                </span>
              )}
              {planejamento.status === "processed" && "Dados Extraídos"}
              {planejamento.status === "parecer_gerado" && "Parecer Gerado"}
              {planejamento.status === "error" && "Erro"}
              {planejamento.status === "arquivado" && "Arquivado"}
            </Badge>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  data-testid="button-excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Planejamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o planejamento de <strong>{planejamento.clienteNome}</strong>? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancelar-excluir">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => excluirMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirmar-excluir"
                    disabled={excluirMutation.isPending}
                  >
                    {excluirMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      "Excluir"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Card de Progresso do Fluxo */}
        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Progresso do Planejamento</h3>
                <span className="text-sm text-muted-foreground">
                  {(() => {
                    const cruzamentoConcluido = inconsistencias.length > 0 || (planejamento.status === "processed" || planejamento.status === "parecer_gerado");
                    const etapas = [
                      planejamento.documentos.length > 0,
                      vinculos.length > 0,
                      cruzamentoConcluido,
                      pendencias.length > 0,
                      !!planejamento.parecerGerado,
                      !!planejamento.resumoExecutivo,
                    ];
                    const concluidas = etapas.filter(Boolean).length;
                    return `${concluidas}/6 etapas`;
                  })()}
                </span>
              </div>
              
              <Progress 
                value={(() => {
                  const cruzamentoConcluido = inconsistencias.length > 0 || (planejamento.status === "processed" || planejamento.status === "parecer_gerado");
                  const etapas = [
                    planejamento.documentos.length > 0,
                    vinculos.length > 0,
                    cruzamentoConcluido,
                    pendencias.length > 0,
                    !!planejamento.parecerGerado,
                    !!planejamento.resumoExecutivo,
                  ];
                  const concluidas = etapas.filter(Boolean).length;
                  return (concluidas / 6) * 100;
                })()} 
                className="h-2"
              />
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${planejamento.documentos.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {planejamento.documentos.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  <span>Documentos</span>
                </div>
                <div className={`flex items-center gap-1 ${vinculos.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {vinculos.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : analisarCnisMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                  <span>Vínculos</span>
                </div>
                <div className={`flex items-center gap-1 ${(inconsistencias.length > 0 || planejamento.status === "processed" || planejamento.status === "parecer_gerado") ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {(inconsistencias.length > 0 || planejamento.status === "processed" || planejamento.status === "parecer_gerado") ? <CheckCircle2 className="w-3 h-3" /> : planejamento.status === "processing" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                  <span>Cruzamento</span>
                </div>
                <div className={`flex items-center gap-1 ${pendencias.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {pendencias.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  <span>Pendências</span>
                </div>
                <div className={`flex items-center gap-1 ${planejamento.parecerGerado ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {planejamento.parecerGerado ? <CheckCircle2 className="w-3 h-3" /> : gerarParecerMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                  <span>Parecer</span>
                </div>
                <div className={`flex items-center gap-1 ${planejamento.resumoExecutivo ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {planejamento.resumoExecutivo ? <CheckCircle2 className="w-3 h-3" /> : gerarResumoMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                  <span>Resumo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="documentos" className="w-full">
          <TabsList className="flex flex-wrap justify-start gap-1 h-auto p-1">
            <TabsTrigger value="documentos" data-testid="tab-documentos" className="flex-shrink-0">
              <FileText className="w-4 h-4 mr-1" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="vinculos" data-testid="tab-vinculos" className="flex-shrink-0">
              <Building2 className="w-4 h-4 mr-1" />
              Vínculos
              {vinculos.length > 0 && <Badge variant="secondary" className="ml-1">{vinculos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="inconsistencias" data-testid="tab-inconsistencias" className="flex-shrink-0">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Inconsistências
              {inconsistencias.length > 0 && <Badge variant="destructive" className="ml-1">{inconsistencias.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="pendencias" data-testid="tab-pendencias" className="flex-shrink-0">
              <ListChecks className="w-4 h-4 mr-1" />
              Pendências
              {pendencias.filter(p => p.status === "aberta").length > 0 && (
                <Badge variant="destructive" className="ml-1">{pendencias.filter(p => p.status === "aberta").length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="parecer" data-testid="tab-parecer" className="flex-shrink-0">
              <Sparkles className="w-4 h-4 mr-1" />
              Parecer
            </TabsTrigger>
            <TabsTrigger value="resumo" data-testid="tab-resumo" className="flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              Resumo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle data-testid="heading-documentos">Documentos Anexados</CardTitle>
                    <CardDescription>
                      {planejamento.documentos.length} arquivo(s) PDF
                    </CardDescription>
                  </div>
                  {planejamento.status === "uploaded" && (
                    <Button
                      onClick={() => processarMutation.mutate()}
                      disabled={processarMutation.isPending}
                      className="gap-2"
                      data-testid="button-processar"
                    >
                      {processarMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                      {processarMutation.isPending ? "Processando..." : "Processar com IA"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" data-testid="list-documentos">
                  {planejamento.documentos.map((doc: Documento) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
                      data-testid={`doc-item-${doc.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium" data-testid={`text-doc-name-${doc.id}`}>
                            {doc.nomeArquivo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tipo: {doc.tipoDocumento}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2" data-testid={`button-download-${doc.id}`}>
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vinculos" className="space-y-4">
            {/* Checklist dos 3 Pilares */}
            <Card data-testid="card-checklist-pilares">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2" data-testid="heading-checklist">
                  <ListChecks className="w-5 h-5" />
                  Checklist dos 3 Pilares
                </CardTitle>
                <CardDescription>
                  Validação das etapas essenciais do planejamento previdenciário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pilar 1: Identificação */}
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      checklist?.identificacaoConfirmada 
                        ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" 
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() => updateChecklistMutation.mutate({ 
                      pilar: "identificacaoConfirmada", 
                      valor: !checklist?.identificacaoConfirmada 
                    })}
                    data-testid="pilar-identificacao"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        checklist?.identificacaoConfirmada 
                          ? "bg-green-500 text-white" 
                          : "bg-muted-foreground/20"
                      }`}>
                        {checklist?.identificacaoConfirmada ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">1</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Identificação Confirmada</p>
                        <p className="text-sm text-muted-foreground">
                          Dados do segurado validados
                        </p>
                        {checklist?.identificacaoConfirmadaEm && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {format(new Date(checklist.identificacaoConfirmadaEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pilar 2: Vínculos */}
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      checklist?.vinculosExtraidos 
                        ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" 
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() => updateChecklistMutation.mutate({ 
                      pilar: "vinculosExtraidos", 
                      valor: !checklist?.vinculosExtraidos 
                    })}
                    data-testid="pilar-vinculos"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        checklist?.vinculosExtraidos 
                          ? "bg-green-500 text-white" 
                          : "bg-muted-foreground/20"
                      }`}>
                        {checklist?.vinculosExtraidos ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">2</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Vínculos Extraídos</p>
                        <p className="text-sm text-muted-foreground">
                          Histórico profissional analisado
                        </p>
                        {checklist?.vinculosExtraidosEm && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {format(new Date(checklist.vinculosExtraidosEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pilar 3: Remunerações */}
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      checklist?.remuneracoesAnalisadas 
                        ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" 
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() => updateChecklistMutation.mutate({ 
                      pilar: "remuneracoesAnalisadas", 
                      valor: !checklist?.remuneracoesAnalisadas 
                    })}
                    data-testid="pilar-remuneracoes"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        checklist?.remuneracoesAnalisadas 
                          ? "bg-green-500 text-white" 
                          : "bg-muted-foreground/20"
                      }`}>
                        {checklist?.remuneracoesAnalisadas ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">3</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Remunerações Analisadas</p>
                        <p className="text-sm text-muted-foreground">
                          Contribuições e competências verificadas
                        </p>
                        {checklist?.remuneracoesAnalisadasEm && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {format(new Date(checklist.remuneracoesAnalisadasEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seção de Validação de Identificação */}
            {(identificacao || alertasIdentificacao.length > 0) && (
              <Card data-testid="card-identificacao">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2" data-testid="heading-identificacao">
                        <FileText className="w-5 h-5" />
                        Identificação do Segurado
                      </CardTitle>
                      <CardDescription>
                        Dados de identificação extraídos do CNIS
                      </CardDescription>
                    </div>
                    {alertasIdentificacao.length === 0 && identificacao && (
                      <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Validado
                      </Badge>
                    )}
                    {alertasIdentificacao.filter(a => a.gravidade === "alta").length > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Atenção Necessária
                      </Badge>
                    )}
                    {alertasIdentificacao.length > 0 && alertasIdentificacao.filter(a => a.gravidade === "alta").length === 0 && (
                      <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-600">
                        <AlertTriangle className="w-3 h-3" />
                        Verificar
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {identificacao && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Nome Completo</p>
                        <p className="font-medium" data-testid="text-identificacao-nome">
                          {identificacao.nomeCompleto || "Não informado"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">CPF</p>
                        <p className="font-medium" data-testid="text-identificacao-cpf">
                          {identificacao.cpf || "Não informado"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Nome da Mãe</p>
                        <p className="font-medium" data-testid="text-identificacao-mae">
                          {identificacao.nomeMae || "Não informado"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                        <p className="font-medium" data-testid="text-identificacao-nascimento">
                          {identificacao.dataNascimento || "Não informado"}
                        </p>
                      </div>
                      {identificacao.nits && identificacao.nits.length > 0 && (
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-sm text-muted-foreground">NITs</p>
                          <div className="flex gap-2 flex-wrap">
                            {identificacao.nits.map((nit, idx) => (
                              <Badge key={idx} variant="outline" data-testid={`badge-nit-${idx}`}>
                                {nit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {alertasIdentificacao.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <p className="text-sm font-medium text-muted-foreground">Alertas de Validação</p>
                      {alertasIdentificacao.map((alerta) => (
                        <div
                          key={alerta.id}
                          className={`p-3 rounded-lg border ${
                            alerta.gravidade === "alta" 
                              ? "bg-destructive/10 border-destructive/30" 
                              : "bg-yellow-500/10 border-yellow-500/30"
                          }`}
                          data-testid={`alerta-identificacao-${alerta.id}`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              alerta.gravidade === "alta" ? "text-destructive" : "text-yellow-600"
                            }`} />
                            <p className={`text-sm flex-1 ${
                              alerta.gravidade === "alta" ? "text-destructive" : "text-yellow-700 dark:text-yellow-500"
                            }`}>
                              {alerta.mensagem}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditClienteNome(planejamento.clienteNome);
                            setEditClienteCpf(planejamento.clienteCpf);
                            setEditarClienteOpen(true);
                          }}
                          data-testid="button-editar-cliente"
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Editar Dados do Cliente
                        </Button>
                        {identificacao && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => usarDadosCnisMutation.mutate()}
                            disabled={usarDadosCnisMutation.isPending}
                            data-testid="button-usar-dados-cnis"
                          >
                            {usarDadosCnisMutation.isPending ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3 mr-1" />
                            )}
                            Usar Dados do CNIS
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle data-testid="heading-vinculos">
                      <Building2 className="w-5 h-5 inline mr-2" />
                      Vínculos do CNIS
                    </CardTitle>
                    <CardDescription>
                      Histórico de vínculos empregatícios extraídos do CNIS
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {planejamento.documentos.some(d => d.tipoDocumento === "CNIS") && (
                      <Button
                        onClick={() => analisarCnisMutation.mutate()}
                        disabled={analisarCnisMutation.isPending || vinculosLoading}
                        variant={vinculos.length > 0 ? "outline" : "default"}
                        className="gap-2"
                        data-testid="button-analisar-cnis"
                      >
                        {analisarCnisMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4" />
                        )}
                        {analisarCnisMutation.isPending 
                          ? "Analisando..." 
                          : vinculos.length > 0 
                            ? "Reanalisar CNIS" 
                            : "Analisar CNIS"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {vinculosLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando vínculos...</span>
                  </div>
                ) : vinculosError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <p className="text-destructive mb-4" data-testid="text-vinculos-error">
                      Erro ao carregar vínculos. Tente novamente.
                    </p>
                    <Button variant="outline" onClick={() => refetchVinculos()}>
                      Tentar Novamente
                    </Button>
                  </div>
                ) : vinculos.length > 0 ? (
                  <div className="space-y-4" data-testid="list-vinculos">
                    {vinculos.map((vinculo) => (
                      <div
                        key={vinculo.id}
                        className="border rounded-lg bg-card"
                        data-testid={`vinculo-item-${vinculo.id}`}
                      >
                        <button
                          className="w-full flex items-center justify-between p-4 text-left hover-elevate rounded-lg"
                          onClick={() => setVinculoExpandido(
                            vinculoExpandido === vinculo.id ? null : vinculo.id
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{vinculo.sequencia}</span>
                            </div>
                            <div>
                              <p className="font-medium">{vinculo.empregador}</p>
                              <p className="text-sm text-muted-foreground">
                                {vinculo.dataInicio || "?"} - {vinculo.dataFim || "Atual"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {vinculo.tipoVinculo && (
                              <Badge variant="outline">{vinculo.tipoVinculo}</Badge>
                            )}
                            {vinculo.indicadores && vinculo.indicadores.length > 0 && (
                              <Badge variant="secondary">{vinculo.indicadores.length} indicadores</Badge>
                            )}
                            {/* Badge de Análise de Competências */}
                            {analiseCompetencias && (() => {
                              const analise = analiseCompetencias.analises.find(
                                (a: any) => a.vinculoId === vinculo.id
                              );
                              if (!analise || analise.mesesFaltantes.length === 0) return null;
                              return (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant={analise.impacto === "alto" ? "destructive" : "secondary"}
                                      className={analise.impacto === "baixo" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}
                                      data-testid={`badge-competencia-${vinculo.id}`}
                                    >
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      {analise.mesesFaltantes.length} meses
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="font-medium mb-1">
                                      {analise.impacto === "alto" ? "Alto Impacto" : "Baixo Impacto"}
                                    </p>
                                    <p className="text-sm">{analise.mensagem}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })()}
                            {/* Badge de Problemas de Remuneração */}
                            {problemasRemuneracao.length > 0 && (() => {
                              const problemas = problemasRemuneracao.filter(
                                p => p.vinculoId === vinculo.id
                              );
                              if (problemas.length === 0) return null;
                              
                              const zeradas = problemas.filter(p => p.tipo === "zerada").length;
                              const ausentes = problemas.filter(p => p.tipo === "ausente").length;
                              const muitoBaixas = problemas.filter(p => p.tipo === "muito_baixa").length;
                              const altaGravidade = problemas.filter(p => p.gravidade === "alta").length;
                              const mediaGravidade = problemas.filter(p => p.gravidade === "media").length;
                              
                              const partes = [];
                              if (zeradas > 0) partes.push(`${zeradas} zerada${zeradas > 1 ? "s" : ""}`);
                              if (ausentes > 0) partes.push(`${ausentes} ausente${ausentes > 1 ? "s" : ""}`);
                              if (muitoBaixas > 0) partes.push(`${muitoBaixas} muito baixa${muitoBaixas > 1 ? "s" : ""}`);
                              
                              const hasAltaGravidade = altaGravidade > 0;
                              
                              return (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant={hasAltaGravidade ? "destructive" : "secondary"}
                                      className={!hasAltaGravidade ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                                      data-testid={`badge-problemas-${vinculo.id}`}
                                    >
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {problemas.length} prob.
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="font-medium mb-1">Problemas de Remuneração</p>
                                    <p className="text-sm">{partes.join(", ")}</p>
                                    <p className="text-xs mt-1 opacity-80">
                                      {altaGravidade > 0 && <span className="text-destructive font-medium">{altaGravidade} alta gravidade</span>}
                                      {altaGravidade > 0 && mediaGravidade > 0 && " • "}
                                      {mediaGravidade > 0 && <span className="text-orange-400">{mediaGravidade} média gravidade</span>}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })()}
                            {vinculoExpandido === vinculo.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>
                        {vinculoExpandido === vinculo.id && (
                          <div className="px-4 pb-4 pt-2 border-t space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">NIT</p>
                                <p className="font-medium">{vinculo.nit || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">CNPJ/CPF</p>
                                <p className="font-medium">{vinculo.cnpjCpf || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Última Remuneração</p>
                                <p className="font-medium">{vinculo.ultimaRemuneracao || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Origem</p>
                                <p className="font-medium">{vinculo.origemDocumento}</p>
                              </div>
                            </div>
                            {vinculo.indicadores && vinculo.indicadores.length > 0 && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Indicadores:</p>
                                <div className="flex flex-wrap gap-1">
                                  {vinculo.indicadores.map((ind, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {ind}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Campo de Observações Editável */}
                            <div className="space-y-2">
                              <Label htmlFor={`observacoes-${vinculo.id}`} className="text-sm text-muted-foreground">
                                Observações:
                              </Label>
                              <Textarea
                                id={`observacoes-${vinculo.id}`}
                                placeholder="Adicione observações sobre este vínculo..."
                                value={observacoesEditando[vinculo.id] ?? vinculo.observacoes ?? ""}
                                onChange={(e) => setObservacoesEditando({
                                  ...observacoesEditando,
                                  [vinculo.id]: e.target.value
                                })}
                                className="min-h-[60px] text-sm"
                                data-testid={`input-observacoes-${vinculo.id}`}
                              />
                              {(observacoesEditando[vinculo.id] !== undefined && 
                                observacoesEditando[vinculo.id] !== (vinculo.observacoes ?? "")) && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    updateObservacoesMutation.mutate({
                                      vinculoId: vinculo.id,
                                      observacoes: observacoesEditando[vinculo.id]
                                    });
                                    setObservacoesEditando(prev => {
                                      const updated = { ...prev };
                                      delete updated[vinculo.id];
                                      return updated;
                                    });
                                  }}
                                  disabled={updateObservacoesMutation.isPending}
                                  className="gap-2"
                                  data-testid={`button-salvar-observacoes-${vinculo.id}`}
                                >
                                  {updateObservacoesMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  Salvar Observações
                                </Button>
                              )}
                            </div>
                            {/* Lista de Problemas de Remuneração */}
                            {(() => {
                              const problemas = problemasRemuneracao.filter(
                                p => p.vinculoId === vinculo.id
                              );
                              if (problemas.length === 0) return null;
                              return (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                  <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Problemas de Remuneração Detectados ({problemas.length})
                                  </p>
                                  <div className="space-y-2">
                                    {problemas.map((problema) => (
                                      <div
                                        key={problema.id}
                                        className={`p-2 rounded text-sm ${
                                          problema.gravidade === "alta"
                                            ? "bg-destructive/20 text-destructive"
                                            : "bg-orange-500/20 text-orange-600"
                                        }`}
                                        data-testid={`problema-${problema.id}`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">
                                            Competência: {problema.competencia}
                                          </span>
                                          <Badge 
                                            variant={problema.gravidade === "alta" ? "destructive" : "secondary"}
                                            className="text-xs"
                                          >
                                            {problema.tipo === "zerada" && "Zerada"}
                                            {problema.tipo === "ausente" && "Ausente"}
                                            {problema.tipo === "muito_baixa" && "Muito Baixa"}
                                          </Badge>
                                        </div>
                                        <p className="text-xs mt-1 opacity-80">
                                          {problema.valor ? `Valor: ${problema.valor}` : "Sem valor registrado"}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                            {vinculo.contribuicoes && vinculo.contribuicoes.length > 0 && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Contribuições ({vinculo.contribuicoes.length}):
                                </p>
                                <div className="max-h-40 overflow-auto">
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    {vinculo.contribuicoes.slice(0, 24).map((c, idx) => (
                                      <div key={idx} className="p-2 bg-muted rounded">
                                        <span className="font-medium">{c.competencia}</span>
                                        {c.remuneracao && (
                                          <span className="text-muted-foreground ml-2">{c.remuneracao}</span>
                                        )}
                                      </div>
                                    ))}
                                    {vinculo.contribuicoes.length > 24 && (
                                      <div className="p-2 bg-muted rounded text-center">
                                        +{vinculo.contribuicoes.length - 24} mais
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" data-testid="text-no-vinculos">
                      Nenhum vínculo extraído ainda. Faça upload de um CNIS e clique em "Analisar CNIS".
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {vinculos.length > 0 && analiseCompetencias && (
              <Card data-testid="card-analise-competencias">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        <Calculator className="w-4 h-4 inline mr-2" />
                        Análise de Competências
                      </CardTitle>
                      <CardDescription>
                        Verificação de meses faltantes em cada vínculo
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchCompetencias()}
                      disabled={competenciasLoading}
                      data-testid="button-refetch-competencias"
                    >
                      {competenciasLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                      Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg" data-testid="resumo-competencias">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{analiseCompetencias.resumo.totalVinculos}</p>
                      <p className="text-sm text-muted-foreground">Vínculos Analisados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{analiseCompetencias.resumo.vinculosComFaltas}</p>
                      <p className="text-sm text-muted-foreground">Com Meses Faltantes</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${analiseCompetencias.resumo.vinculosAltoImpacto > 0 ? "text-destructive" : "text-green-600"}`}>
                        {analiseCompetencias.resumo.vinculosAltoImpacto}
                      </p>
                      <p className="text-sm text-muted-foreground">Alto Impacto</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{analiseCompetencias.resumo.totalMesesFaltantes}</p>
                      <p className="text-sm text-muted-foreground">Total de Meses Faltantes</p>
                    </div>
                  </div>

                  <div className="space-y-3" data-testid="list-analise-competencias">
                    {analiseCompetencias.analises.map((analise) => (
                      <div
                        key={analise.vinculoId}
                        className={`p-4 rounded-lg border ${
                          analise.mesesFaltantes.length === 0 
                            ? "border-green-500/30 bg-green-50 dark:bg-green-950/20" 
                            : analise.impacto === "alto"
                              ? "border-destructive/30 bg-destructive/5"
                              : "border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20"
                        }`}
                        data-testid={`analise-competencia-${analise.vinculoId}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              analise.mesesFaltantes.length === 0
                                ? "bg-green-500/20 text-green-600"
                                : analise.impacto === "alto"
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-yellow-500/20 text-yellow-600"
                            }`}>
                              {analise.mesesFaltantes.length === 0 ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : analise.impacto === "alto" ? (
                                <AlertCircle className="w-4 h-4" />
                              ) : (
                                <AlertTriangle className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                <span className="text-primary">#{analise.vinculoSequencia}</span> - {analise.empregador}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {analise.mesesEsperados} meses esperados | {analise.mesesRegistrados} registrados
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {analise.mesesFaltantes.length === 0 ? (
                              <Badge className="bg-green-500">Completo</Badge>
                            ) : (
                              <>
                                <Badge variant={analise.impacto === "alto" ? "destructive" : "secondary"}>
                                  {analise.mesesFaltantes.length} faltante(s)
                                </Badge>
                                <Badge variant={analise.impacto === "alto" ? "destructive" : "outline"}>
                                  Impacto {analise.impacto}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-sm mt-2 text-muted-foreground">{analise.mensagem}</p>
                        {analise.mesesFaltantes.length > 0 && analise.mesesFaltantes.length <= 12 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {analise.mesesFaltantes.map((mes, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {mes}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {vinculos.length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Cruzamento de Dados
                      </CardTitle>
                      <CardDescription>
                        Compare o CNIS com outros documentos para detectar inconsistências
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 border border-muted">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Como funciona:</strong> Envie documentos como CTPS, PPP, FGTS ou contracheques. 
                      O sistema irá comparar automaticamente com os dados do CNIS e identificar divergências como 
                      datas diferentes, vínculos não registrados ou remunerações inconsistentes.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                    <div className="flex-1">
                      <Label htmlFor="tipo-doc-cruzar" className="mb-2 block">Tipo do Documento</Label>
                      <select
                        id="tipo-doc-cruzar"
                        value={tipoDocCruzar}
                        onChange={(e) => setTipoDocCruzar(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        data-testid="select-tipo-doc"
                      >
                        <option value="CTPS">CTPS (Carteira de Trabalho)</option>
                        <option value="PPP">PPP (Perfil Profissiográfico)</option>
                        <option value="FGTS">Extrato FGTS</option>
                        <option value="Holerite">Holerites/Contracheques</option>
                        <option value="Contrato">Contrato de Trabalho</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="cruzar-doc-file" className="mb-2 block">Arquivo PDF</Label>
                      <Input
                        ref={cruzarDocFileRef}
                        id="cruzar-doc-file"
                        type="file"
                        accept=".pdf"
                        onChange={handleCruzarDocumento}
                        disabled={cruzarDocumentoMutation.isPending}
                        data-testid="input-cruzar-doc"
                      />
                    </div>
                  </div>
                  {cruzarDocumentoMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground p-4 bg-muted/30 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analisando documento e detectando inconsistências...
                    </div>
                  )}
                  
                  {inconsistencias.length > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-500">
                        <strong>{inconsistencias.length}</strong> inconsistência(s) encontrada(s). Veja a aba <strong>Inconsistências</strong> para detalhes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="inconsistencias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle data-testid="heading-inconsistencias">
                  <AlertTriangle className="w-5 h-5 inline mr-2" />
                  Inconsistências Detectadas
                </CardTitle>
                <CardDescription>
                  Divergências encontradas entre documentos que precisam de atenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inconsistenciasLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando inconsistências...</span>
                  </div>
                ) : inconsistenciasError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <p className="text-destructive">Erro ao carregar inconsistências.</p>
                  </div>
                ) : inconsistencias.length > 0 ? (
                  <div className="space-y-3" data-testid="list-inconsistencias">
                    {inconsistencias.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-4 border rounded-lg space-y-2"
                        data-testid={`inconsistencia-item-${inc.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getGravidadeBadge(inc.gravidade)}>
                                {inc.gravidade.charAt(0).toUpperCase() + inc.gravidade.slice(1)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{inc.tipo}</span>
                            </div>
                            <h4 className="font-medium">{inc.titulo}</h4>
                            <p className="text-sm text-muted-foreground">{inc.descricao}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Origem: {inc.documentoOrigem}</span>
                          {inc.documentoComparacao && <span>vs {inc.documentoComparacao}</span>}
                        </div>
                        {inc.sugestaoCorrecao && (
                          <div className="p-2 bg-primary/5 rounded text-sm">
                            <strong>Sugestão:</strong> {inc.sugestaoCorrecao}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground" data-testid="text-no-inconsistencias">
                      Nenhuma inconsistência detectada. Cruze documentos na aba Vínculos para comparar.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pendencias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle data-testid="heading-pendencias">
                  <ListChecks className="w-5 h-5 inline mr-2" />
                  Lista de Pendências
                </CardTitle>
                <CardDescription>
                  Tópicos a resolver junto ao INSS ou obter documentação adicional
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendenciasLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando pendências...</span>
                  </div>
                ) : pendenciasError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <p className="text-destructive">Erro ao carregar pendências.</p>
                  </div>
                ) : pendencias.length > 0 ? (
                  <div className="space-y-3" data-testid="list-pendencias">
                    {pendencias.map((pend) => (
                      <div
                        key={pend.id}
                        className={`p-4 border rounded-lg space-y-2 ${pend.status === "resolvida" ? "opacity-60" : ""} ${pend.impactaCalculo ? "border-l-4 border-l-destructive" : ""}`}
                        data-testid={`pendencia-item-${pend.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant={getPrioridadeBadge(pend.prioridade)}>
                                {pend.prioridade.charAt(0).toUpperCase() + pend.prioridade.slice(1)}
                              </Badge>
                              <Badge variant="outline">{pend.tipo}</Badge>
                              {pend.impactaCalculo && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="destructive" className="gap-1" data-testid={`badge-impacta-${pend.id}`}>
                                      <Calculator className="w-3 h-3" />
                                      Impacta Cálculo
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    Esta pendência pode afetar o cálculo do benefício
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {pend.status === "resolvida" && (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Resolvida
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-medium">{pend.titulo}</h4>
                            <p className="text-sm text-muted-foreground">{pend.descricao}</p>
                            {pend.contexto && (
                              <p className="text-xs text-primary/80 mt-1 italic" data-testid={`text-contexto-${pend.id}`}>
                                Contexto: {pend.contexto}
                              </p>
                            )}
                          </div>
                          {pend.status !== "resolvida" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => atualizarPendenciaMutation.mutate({
                                pendenciaId: pend.id,
                                status: "resolvida"
                              })}
                              disabled={atualizarPendenciaMutation.isPending}
                              data-testid={`button-resolver-${pend.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Marcar Resolvida
                            </Button>
                          )}
                        </div>
                        {pend.acaoNecessaria && (
                          <div className="p-2 bg-muted rounded text-sm">
                            <strong>Ação Necessária:</strong> {pend.acaoNecessaria}
                          </div>
                        )}
                        {pend.documentosNecessarios && pend.documentosNecessarios.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground">Documentos necessários:</span>
                            {pend.documentosNecessarios.map((doc, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {pend.resolvidaEm && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Resolvida em: {format(new Date(pend.resolvidaEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ListChecks className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" data-testid="text-no-pendencias">
                      Nenhuma pendência registrada. Analise o CNIS e cruze documentos para detectar pendências.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parecer" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle data-testid="heading-parecer">Parecer Técnico Previdenciário</CardTitle>
                    <CardDescription>
                      Análise completa gerada pela IA (editável)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!planejamento.parecerGerado && planejamento.status === "processed" && (
                      <Button
                        onClick={() => gerarParecerMutation.mutate()}
                        disabled={gerarParecerMutation.isPending}
                        className="gap-2"
                        data-testid="button-gerar-parecer-tab"
                      >
                        {gerarParecerMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {gerarParecerMutation.isPending ? "Gerando..." : "Gerar Parecer"}
                      </Button>
                    )}
                    {planejamento.parecerGerado && !planejamento.resumoExecutivo && (
                      <Button
                        variant="outline"
                        onClick={() => gerarResumoMutation.mutate()}
                        disabled={gerarResumoMutation.isPending}
                        className="gap-2"
                        data-testid="button-gerar-resumo"
                      >
                        {gerarResumoMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4" />
                        )}
                        Gerar Resumo
                      </Button>
                    )}
                    {planejamento.parecerGerado && (
                      <Button
                        onClick={() => salvarParecerMutation.mutate()}
                        disabled={salvarParecerMutation.isPending || editedParecer === planejamento.parecerGerado}
                        className="gap-2"
                        data-testid="button-salvar-parecer"
                      >
                        <Save className="w-4 h-4" />
                        Salvar Alterações
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {planejamento.parecerGerado ? (
                  <div className="space-y-4">
                    {(inconsistencias.length > 0 || pendencias.length > 0) && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm flex items-center gap-2 flex-wrap">
                          <AlertCircle className="w-4 h-4 text-primary" />
                          Análise inclui:
                          {inconsistencias.length > 0 && (
                            <Badge variant="secondary">{inconsistencias.length} inconsistência(s)</Badge>
                          )}
                          {pendencias.length > 0 && (
                            <Badge variant="secondary">{pendencias.length} pendência(s)</Badge>
                          )}
                        </p>
                      </div>
                    )}
                    <Textarea
                      value={editedParecer || planejamento.parecerGerado}
                      onChange={(e) => setEditedParecer(e.target.value)}
                      onFocus={handleParecer}
                      className="min-h-[600px] font-mono text-sm"
                      data-testid="textarea-parecer"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground" data-testid="text-no-parecer">
                    Nenhum parecer gerado ainda. Processe os documentos primeiro na aba Documentos.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumo" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle data-testid="heading-resumo">
                      <FileSpreadsheet className="w-5 h-5 inline mr-2" />
                      Resumo Executivo
                    </CardTitle>
                    <CardDescription>
                      Síntese do parecer para apresentação ao cliente
                    </CardDescription>
                  </div>
                  {planejamento.resumoExecutivo && (
                    <Button 
                      variant="outline" 
                      className="gap-2" 
                      onClick={handleDownloadPDF}
                      disabled={isDownloadingPdf}
                      data-testid="button-download-resumo"
                    >
                      {isDownloadingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Exportar PDF
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {planejamento.resumoExecutivo ? (
                  <div className="space-y-6">
                    <div className="p-6 rounded-lg bg-card border">
                      <div className="whitespace-pre-wrap text-sm" data-testid="text-resumo-executivo">
                        {planejamento.resumoExecutivo}
                      </div>
                    </div>
                    
                    <Card className="border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Proposta de Execução</CardTitle>
                        <CardDescription>
                          Template para proposta comercial ao cliente
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 rounded-lg bg-muted text-sm space-y-4">
                          <p><strong>PROPOSTA DE SERVIÇOS ADVOCATÍCIOS</strong></p>
                          <p>Cliente: {planejamento.clienteNome}</p>
                          <p>CPF: {planejamento.clienteCpf}</p>
                          <p>Data: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
                          <hr className="my-4" />
                          <p><strong>1. OBJETO</strong></p>
                          <p>Assessoria jurídica especializada em direito previdenciário para análise, planejamento e eventual requerimento administrativo e/ou judicial de benefício previdenciário.</p>
                          <p><strong>2. SERVIÇOS INCLUSOS</strong></p>
                          <ul className="list-disc pl-4">
                            <li>Análise completa de documentação previdenciária</li>
                            <li>Parecer técnico com projeções de aposentadoria</li>
                            <li>Identificação de inconsistências e correções necessárias</li>
                            <li>Elaboração de requerimento administrativo ao INSS</li>
                            <li>Acompanhamento de processo administrativo</li>
                          </ul>
                          <p><strong>3. HONORÁRIOS</strong></p>
                          <p>[Inserir valores e condições de pagamento]</p>
                          <p><strong>4. PRAZO</strong></p>
                          <p>[Inserir prazo estimado para conclusão]</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {planejamento.parecerGerado ? (
                      <div className="space-y-4">
                        <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">
                          O resumo executivo ainda não foi gerado.
                        </p>
                        <Button
                          onClick={() => gerarResumoMutation.mutate()}
                          disabled={gerarResumoMutation.isPending}
                          className="gap-2"
                          data-testid="button-gerar-resumo-alt"
                        >
                          {gerarResumoMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {gerarResumoMutation.isPending ? "Gerando..." : "Gerar Resumo Executivo"}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground" data-testid="text-no-resumo">
                        O parecer técnico ainda não foi gerado. Gere o parecer primeiro para criar o resumo executivo.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm">Informações do Planejamento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">ID:</p>
              <p className="font-mono" data-testid="text-id">{planejamento.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Criado em:</p>
              <p data-testid="text-created-at">
                {format(new Date(planejamento.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Status:</p>
              <p data-testid="text-status-info">{planejamento.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Documentos:</p>
              <p data-testid="text-doc-count">{planejamento.documentos.length} arquivo(s)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editarClienteOpen} onOpenChange={setEditarClienteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dados do Cliente</DialogTitle>
            <DialogDescription>
              Atualize o nome e CPF do cliente para corresponder aos dados corretos do CNIS.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome Completo</Label>
              <Input
                id="edit-nome"
                value={editClienteNome}
                onChange={(e) => setEditClienteNome(e.target.value)}
                placeholder="Digite o nome completo"
                data-testid="input-edit-nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cpf">CPF</Label>
              <Input
                id="edit-cpf"
                value={editClienteCpf}
                onChange={(e) => setEditClienteCpf(e.target.value)}
                placeholder="000.000.000-00"
                data-testid="input-edit-cpf"
              />
            </div>
            {identificacao && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-2">Dados extraídos do CNIS:</p>
                <p className="text-sm"><strong>Nome:</strong> {identificacao.nomeCompleto || "Não informado"}</p>
                <p className="text-sm"><strong>CPF:</strong> {identificacao.cpf || "Não informado"}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditarClienteOpen(false)}
              data-testid="button-cancelar-edicao"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => atualizarClienteMutation.mutate({
                clienteNome: editClienteNome,
                clienteCpf: editClienteCpf,
              })}
              disabled={atualizarClienteMutation.isPending}
              data-testid="button-salvar-edicao"
            >
              {atualizarClienteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
