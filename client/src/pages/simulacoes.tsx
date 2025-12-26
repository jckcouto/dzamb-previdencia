import { useState } from "react";
import { RetirementRuleCard } from "@/components/retirement-rule-card";
import { RetirementSimulator } from "@/components/retirement-simulator";
import { AnimatedPage } from "@/components/animated-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, Download, TrendingUp } from "lucide-react";

const mockRules = [
  {
    id: "1",
    ruleName: "Aposentadoria por Tempo de Contribuição",
    ruleDescription: "35 anos de contribuição para homens",
    requirementsMet: 420,
    requirementsTotal: 420,
    projectedDate: "Cumprida",
    estimatedBenefit: "R$ 4.850,00",
    details: [
      { label: "Tempo de contribuição", current: "35 anos", required: "35 anos" },
      { label: "Carência", current: "180 meses", required: "180 meses" },
    ],
  },
  {
    id: "2",
    ruleName: "Regra de Transição 86/96",
    ruleDescription: "Soma de idade + tempo de contribuição",
    requirementsMet: 340,
    requirementsTotal: 420,
    projectedDate: "Março/2027",
    monthsRemaining: 28,
    estimatedBenefit: "R$ 5.120,00",
    details: [
      { label: "Idade atual", current: "58 anos", required: "60 anos" },
      { label: "Tempo de contribuição", current: "28 anos, 4 meses", required: "35 anos" },
      { label: "Pontos atuais", current: "86", required: "96" },
    ],
  },
  {
    id: "3",
    ruleName: "Aposentadoria por Idade",
    ruleDescription: "65 anos de idade + 15 anos de contribuição",
    requirementsMet: 180,
    requirementsTotal: 180,
    projectedDate: "Janeiro/2026",
    monthsRemaining: 14,
    estimatedBenefit: "R$ 3.200,00",
  },
  {
    id: "4",
    ruleName: "Aposentadoria Especial",
    ruleDescription: "25 anos de atividade especial",
    requirementsMet: 240,
    requirementsTotal: 300,
    projectedDate: "Agosto/2029",
    monthsRemaining: 60,
    estimatedBenefit: "R$ 6.100,00",
    details: [
      { label: "Tempo especial", current: "20 anos", required: "25 anos" },
      { label: "PPP validado", current: "Sim", required: "Sim" },
    ],
  },
];

export default function Simulacoes() {
  const [scenario, setScenario] = useState("cnis_only");

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Simulações</h1>
            <p className="text-muted-foreground mt-1">
              Cálculo do tempo de contribuição e projeções de aposentadoria
            </p>
          </div>
          <Button variant="outline" className="gap-2" data-testid="button-export">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        <Tabs defaultValue="regras" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="regras" data-testid="tab-regras">
              <Calculator className="h-4 w-4 mr-2" />
              Regras Aplicáveis
            </TabsTrigger>
            <TabsTrigger value="simulador" data-testid="tab-simulador">
              <TrendingUp className="h-4 w-4 mr-2" />
              Simulador Interativo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regras" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Cenário de Cálculo
                  </CardTitle>
                  <Select value={scenario} onValueChange={setScenario}>
                    <SelectTrigger className="w-[280px]" data-testid="select-scenario">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cnis_only">Somente CNIS</SelectItem>
                      <SelectItem value="with_docs">CNIS + Documentos Complementares</SelectItem>
                      <SelectItem value="manual">Ajuste Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de vínculos considerados:</span>
                    <span className="font-medium tabular-nums">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tempo total de contribuição:</span>
                    <span className="font-medium tabular-nums">28 anos, 4 meses</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contribuições mensais estimadas:</span>
                    <span className="font-medium tabular-nums">R$ 1.850,00</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-xl font-semibold mb-4">Regras de Aposentadoria Aplicáveis</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Análise das regras de aposentadoria e projeção de cumprimento dos requisitos
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {mockRules.map((rule) => (
                  <RetirementRuleCard key={rule.id} {...rule} />
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Melhor Opção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary p-2 flex-shrink-0">
                      <Calculator className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Aposentadoria por Tempo de Contribuição</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requisitos já cumpridos. RMI estimada de <strong className="text-success">R$ 4.850,00</strong>
                      </p>
                      <p className="text-sm mt-2">
                        Esta é a melhor opção considerando o tempo de contribuição atual e a estimativa de benefício.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulador">
            <RetirementSimulator />
          </TabsContent>
        </Tabs>
      </div>
    </AnimatedPage>
  );
}

