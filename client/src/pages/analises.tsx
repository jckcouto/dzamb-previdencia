import { useState } from "react";
import { DocumentUploadZone } from "@/components/document-upload-zone";
import { DocumentViewer } from "@/components/document-viewer";
import { PendingItem } from "@/components/pending-item";
import { DocumentComparator } from "@/components/document-comparator";
import { AnimatedPage } from "@/components/animated-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle } from "lucide-react";

export default function Analises() {
  const [activeTab, setActiveTab] = useState("upload");

  const mockDocuments = [
    { id: "1", name: "CNIS_Maria_Silva.pdf", type: "CNIS", status: "success" as const },
    { id: "2", name: "CTPS_Maria_Silva.pdf", type: "CTPS", status: "warning" as const, issues: 2 },
    { id: "3", name: "Extrato_FGTS.pdf", type: "FGTS", status: "success" as const },
    { id: "4", name: "PPP_Empresa_ABC.pdf", type: "PPP", status: "error" as const, issues: 1 },
  ];

  const mockVinculos = [
    { empresa: "ABC Indústria Ltda", inicio: "01/2015", fim: "12/2020", status: "ok" },
    { empresa: "XYZ Comércio S.A.", inicio: "01/2021", fim: "-", status: "sem_fim" },
    { empresa: "123 Serviços", inicio: "06/2012", fim: "12/2014", status: "ok" },
  ];

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Análise Documental</h1>
          <p className="text-muted-foreground mt-1">
            Faça upload e análise de documentos previdenciários
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upload" data-testid="tab-upload">
              Upload de Documentos
            </TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">
              Resultados da Análise
            </TabsTrigger>
            <TabsTrigger value="comparar" data-testid="tab-comparar">
              Comparar Documentos
            </TabsTrigger>
            <TabsTrigger value="pendencies" data-testid="tab-pendencies">
              Pendências
              <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning/20">
                3
              </Badge>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="upload" className="space-y-6 mt-6">
          <DocumentUploadZone />
          
          <div className="grid gap-6 lg:grid-cols-2">
            <DocumentViewer
              title="Documentos Processados"
              documents={mockDocuments}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Estatísticas de Processamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Documentos processados</span>
                    <span className="font-medium">4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vínculos identificados</span>
                    <span className="font-medium">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Períodos com problemas</span>
                    <span className="font-medium text-warning">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de sucesso OCR</span>
                    <span className="font-medium text-success">98.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vínculos Extraídos do CNIS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Empresa</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Início</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Fim</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockVinculos.map((vinculo, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 text-sm">{vinculo.empresa}</td>
                        <td className="py-3 text-sm tabular-nums">{vinculo.inicio}</td>
                        <td className="py-3 text-sm tabular-nums">{vinculo.fim}</td>
                        <td className="py-3">
                          {vinculo.status === "ok" ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Sem data fim
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparar" className="space-y-6 mt-6">
          <DocumentComparator />
        </TabsContent>

        <TabsContent value="pendencies" className="space-y-4 mt-6">
          <PendingItem
            id="1"
            type="inss_error"
            priority="high"
            title="Vínculo sem data de término"
            description="Empresa XYZ Comércio S.A. - Período iniciado em 01/2021 sem data de encerramento"
            requiredAction="Solicitar ao cliente a CTPS ou carta de dispensa para comprovação do término do vínculo"
          />
          <PendingItem
            id="2"
            type="missing_doc"
            priority="medium"
            title="PPP com inconsistências"
            description="Documento PPP_Empresa_ABC.pdf apresenta período sem exposição a agentes nocivos"
            requiredAction="Solicitar PPP complementar ou correção do documento existente"
          />
          <PendingItem
            id="3"
            type="divergence"
            priority="medium"
            title="Divergência CTPS x CNIS"
            description="Remuneração informada na CTPS difere do CNIS em 2 períodos"
          />
        </TabsContent>
      </Tabs>
    </div>
    </AnimatedPage>
  );
}
