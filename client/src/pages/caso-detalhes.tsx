import { useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentViewer } from "@/components/document-viewer";
import { PendingItem } from "@/components/pending-item";
import { TimelineVinculos } from "@/components/timeline-vinculos";
import { TagManager } from "@/components/tag-manager";
import { ActivityTimeline, type Activity } from "@/components/activity-timeline";
import { CollaborationPanel } from "@/components/collaboration-panel";
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Download,
} from "lucide-react";
import { Link } from "wouter";

export default function CasoDetalhes() {
  const [, params] = useRoute("/casos/:id");
  const casoId = params?.id || "1";
  const [tags, setTags] = useState<string[]>(["CNIS Pendente", "Prazo Apertado"]);
  const [atribuidoA, setAtribuidoA] = useState<string | undefined>("1");

  const mockCaso = {
    id: casoId,
    cliente: {
      nome: "Maria Silva Santos",
      cpf: "123.456.789-00",
      dataNascimento: "15/03/1975",
      email: "maria.silva@email.com",
      telefone: "(11) 98765-4321",
      endereco: "São Paulo, SP",
      foto: null,
    },
    status: "analyzing" as const,
    tempoContribuicao: "28 anos, 4 meses",
    documentosCount: 8,
    pendenciasCount: 3,
    ultimaAtualizacao: "2 dias atrás",
    criadoEm: "10/09/2024",
  };

  const mockDocumentos = [
    { id: "1", name: "CNIS_Maria_Silva.pdf", type: "CNIS", status: "success" as const },
    { id: "2", name: "CTPS_Maria_Silva.pdf", type: "CTPS", status: "warning" as const, issues: 2 },
    { id: "3", name: "Extrato_FGTS.pdf", type: "FGTS", status: "success" as const },
    { id: "4", name: "PPP_Empresa_ABC.pdf", type: "PPP", status: "error" as const, issues: 1 },
  ];

  const mockVinculos = [
    {
      id: "1",
      empresa: "ABC Indústria Ltda",
      inicio: new Date(2015, 0, 1),
      fim: new Date(2020, 11, 31),
      tipo: "comum" as const,
      remuneracao: "R$ 3.200,00",
    },
    {
      id: "2",
      empresa: "XYZ Comércio S.A.",
      inicio: new Date(2021, 0, 1),
      fim: null,
      tipo: "comum" as const,
      remuneracao: "R$ 4.500,00",
    },
  ];

  const mockActivities: Activity[] = [
    {
      id: "1",
      tipo: "document",
      usuario: "Dr. Carlos Silva",
      descricao: "Enviou novo documento",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metadata: { documentoNome: "CNIS_Maria_Silva.pdf" },
    },
    {
      id: "2",
      tipo: "status",
      usuario: "Sistema",
      descricao: "Status do caso alterado",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      metadata: { statusAnterior: "Rascunho", statusNovo: "Em Análise" },
    },
    {
      id: "3",
      tipo: "tag",
      usuario: "Dr. Carlos Silva",
      descricao: "Atualizou as tags do caso",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      metadata: { tagsAdicionadas: ["CNIS Pendente", "Prazo Apertado"] },
    },
    {
      id: "4",
      tipo: "comment",
      usuario: "Dra. Ana Oliveira",
      descricao: "Adicionou um comentário",
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
    },
  ];

  const mockComments = [
    {
      id: "1",
      usuario: "Dr. Carlos Silva",
      conteudo: "Cliente forneceu todos os documentos necessários. Iniciando análise detalhada do CNIS.",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      isInternal: false,
    },
    {
      id: "2",
      usuario: "Dra. Ana Oliveira",
      conteudo: "Identificadas 3 pendências no CNIS. Precisamos solicitar CTPS complementar.",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isInternal: true,
    },
  ];

  const initials = mockCaso.cliente.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/casos">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Caso</h1>
            <p className="text-muted-foreground mt-1">
              Caso #{mockCaso.id} • Criado em {mockCaso.criadoEm}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" data-testid="button-export">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2" data-testid="button-gerar-parecer">
            <FileText className="h-4 w-4" />
            Gerar Parecer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar - Informações do Cliente */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{mockCaso.cliente.nome}</h3>
                  <p className="text-sm text-muted-foreground">{mockCaso.cliente.cpf}</p>
                </div>
                <Button variant="ghost" size="icon" data-testid="button-edit-client">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-start gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">{mockCaso.cliente.dataNascimento}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">E-mail</p>
                    <p className="font-medium">{mockCaso.cliente.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{mockCaso.cliente.telefone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Endereço</p>
                    <p className="font-medium">{mockCaso.cliente.endereco}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status do Caso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                    Em Análise
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tempo de Contribuição</span>
                  <span className="font-medium tabular-nums">{mockCaso.tempoContribuicao}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Documentos</span>
                  <span className="font-medium tabular-nums">{mockCaso.documentosCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pendências</span>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    {mockCaso.pendenciasCount}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Última Atualização</span>
                  <span className="font-medium">{mockCaso.ultimaAtualizacao}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags do Caso</CardTitle>
            </CardHeader>
            <CardContent>
              <TagManager tags={tags} onTagsChange={setTags} />
            </CardContent>
          </Card>

          <Tabs defaultValue="documentos">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
              <TabsTrigger value="documentos" data-testid="tab-documentos">
                Docs
              </TabsTrigger>
              <TabsTrigger value="vinculos" data-testid="tab-vinculos">
                Vínculos
              </TabsTrigger>
              <TabsTrigger value="pendencias" data-testid="tab-pendencias">
                Pendências
                {mockCaso.pendenciasCount > 0 && (
                  <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning/20">
                    {mockCaso.pendenciasCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="atividades" data-testid="tab-atividades" className="hidden lg:flex">
                Atividades
              </TabsTrigger>
              <TabsTrigger value="colaboracao" data-testid="tab-colaboracao">
                Colab
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documentos" className="space-y-4 mt-6">
              <DocumentViewer
                title="Documentos do Caso"
                documents={mockDocumentos}
              />
            </TabsContent>

            <TabsContent value="vinculos" className="space-y-4 mt-6">
              <TimelineVinculos vinculos={mockVinculos} />
            </TabsContent>

            <TabsContent value="pendencias" className="space-y-4 mt-6">
              <PendingItem
                id="1"
                type="inss_error"
                priority="high"
                title="Vínculo sem data de término"
                description="Empresa XYZ Comércio S.A. - Período iniciado em 01/2021"
                requiredAction="Solicitar CTPS ou carta de dispensa"
              />
              <PendingItem
                id="2"
                type="missing_doc"
                priority="medium"
                title="Falta extrato do FGTS"
                description="Período de 2015 a 2017 sem comprovação"
                requiredAction="Solicitar extrato analítico do FGTS"
              />
              <PendingItem
                id="3"
                type="divergence"
                priority="low"
                title="Divergência de remuneração"
                description="CTPS difere do CNIS em 2 períodos"
              />
            </TabsContent>

            <TabsContent value="atividades" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Histórico de Atividades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityTimeline activities={mockActivities} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colaboracao" className="space-y-4 mt-6">
              <CollaborationPanel
                caseId={casoId}
                comments={mockComments}
                atribuidoA={atribuidoA}
                onCommentAdd={(conteudo, isInternal) => {
                  console.log("Novo comentário:", { conteudo, isInternal });
                }}
                onAssignmentChange={(userId) => {
                  setAtribuidoA(userId);
                  console.log("Caso atribuído a:", userId);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
