import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Edit, Eye, Plus } from "lucide-react";

const mockPareceres = [
  {
    id: "1",
    clientName: "Maria Silva Santos",
    createdAt: "15/01/2025",
    status: "published" as const,
    lastEdit: "16/01/2025",
  },
  {
    id: "2",
    clientName: "João Pedro Oliveira",
    createdAt: "10/01/2025",
    status: "draft" as const,
    lastEdit: "12/01/2025",
  },
  {
    id: "3",
    clientName: "Ana Carolina Lima",
    createdAt: "08/01/2025",
    status: "published" as const,
    lastEdit: "08/01/2025",
  },
];

export default function Pareceres() {
  const [selectedParecer, setSelectedParecer] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pareceres Técnicos</h1>
          <p className="text-muted-foreground mt-1">
            Visualize resumos dos pareceres gerados automaticamente
          </p>
        </div>
        <Button className="gap-2" data-testid="button-new-parecer">
          <Plus className="h-4 w-4" />
          Novo Parecer
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Pareceres Salvos</h2>
          {mockPareceres.map((parecer) => (
            <Card
              key={parecer.id}
              className={`cursor-pointer transition-all hover-elevate ${
                selectedParecer === parecer.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => {
                setSelectedParecer(parecer.id);
                console.log('Selected parecer:', parecer.id);
              }}
              data-testid={`parecer-item-${parecer.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{parecer.clientName}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado em {parecer.createdAt}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      parecer.status === 'published'
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {parecer.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-${parecer.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button size="sm" variant="outline" data-testid={`button-edit-${parecer.id}`}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedParecer ? 'Editor de Parecer' : 'Preview do Parecer'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid="button-save-draft">
                    Salvar Rascunho
                  </Button>
                  <Button size="sm" className="gap-2" data-testid="button-generate-pdf">
                    <Download className="h-4 w-4" />
                    Gerar PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedParecer ? (
                <div className="space-y-6 rounded-lg border border-border p-6 bg-card min-h-[600px]">
                  <div className="text-center space-y-4 border-b border-border pb-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center">
                        <FileText className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold">DZAMB Advocacia</h3>
                        <p className="text-sm text-muted-foreground">OAB/SP 123.456</p>
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold">PARECER TÉCNICO PREVIDENCIÁRIO</h1>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">CLIENTE</h3>
                      <p>Maria Silva Santos</p>
                      <p className="text-sm text-muted-foreground">CPF: 123.456.789-00</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">RESUMO DA ANÁLISE</h3>
                      <p className="text-sm leading-relaxed">
                        Após análise detalhada da documentação previdenciária apresentada, incluindo CNIS, 
                        CTPS e demais comprovantes, identificamos um tempo total de contribuição de 
                        <strong> 28 anos e 4 meses</strong>.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">PENDÊNCIAS IDENTIFICADAS</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Vínculo sem data de término - Empresa ABC Ltda</li>
                        <li>Falta extrato do FGTS para o período 2015-2017</li>
                        <li>Divergência de remuneração no período 06/2019</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">PROJEÇÃO DE APOSENTADORIA</h3>
                      <p className="text-sm leading-relaxed">
                        Considerando o cenário atual, a cliente já cumpre os requisitos para 
                        <strong> Aposentadoria por Tempo de Contribuição</strong>, com RMI estimada de 
                        <strong className="text-success"> R$ 4.850,00</strong>.
                      </p>
                    </div>

                    <div className="pt-6 border-t border-border text-center">
                      <p className="text-sm text-muted-foreground">
                        São Paulo, 28 de outubro de 2025
                      </p>
                      <div className="mt-8">
                        <div className="border-t border-border w-64 mx-auto pt-2">
                          <p className="text-sm font-semibold">Dr. Advogado</p>
                          <p className="text-xs text-muted-foreground">OAB/SP 123.456</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                  <div className="text-center space-y-2">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Selecione um parecer para visualizar ou editar</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
