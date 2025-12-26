import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface SimulationResult {
  regra: string;
  elegivel: boolean;
  dataElegibilidade: string;
  tempoFaltante?: string;
  pontosAtuais?: number;
  pontosNecessarios?: number;
  idadeMinima?: number;
  tempoContribuicao?: number;
  observacoes: string[];
}

export function RetirementSimulator() {
  const [sexo, setSexo] = useState<"M" | "F">("F");
  const [dataNascimento, setDataNascimento] = useState("15/03/1968");
  const [tempoContribuicao, setTempoContribuicao] = useState(28);
  const [idade, setIdade] = useState(57);
  const [projecaoAnos, setProjecaoAnos] = useState([3]);

  const calcularSimulacao = (): SimulationResult[] => {
    const anosProjecao = projecaoAnos[0];
    const tempoFuturo = tempoContribuicao + anosProjecao;
    const idadeFutura = idade + anosProjecao;

    const resultados: SimulationResult[] = [];

    // Regra 1: Aposentadoria por Idade (Reforma 2019)
    const idadeMinimaIdade = sexo === "M" ? 65 : 62;
    const tempoMinimoIdade = 15;
    const elegivelIdade = idadeFutura >= idadeMinimaIdade && tempoFuturo >= tempoMinimoIdade;
    
    resultados.push({
      regra: "Aposentadoria por Idade",
      elegivel: elegivelIdade,
      dataElegibilidade: elegivelIdade
        ? `Elegível em ${anosProjecao} anos`
        : `Faltam ${Math.max(idadeMinimaIdade - idadeFutura, tempoMinimoIdade - tempoFuturo)} anos`,
      tempoFaltante: !elegivelIdade
        ? `${Math.max(0, idadeMinimaIdade - idadeFutura)} anos de idade ou ${Math.max(0, tempoMinimoIdade - tempoFuturo)} anos de contribuição`
        : undefined,
      idadeMinima: idadeMinimaIdade,
      tempoContribuicao: tempoMinimoIdade,
      observacoes: [
        `Idade mínima: ${idadeMinimaIdade} anos`,
        `Tempo mínimo: ${tempoMinimoIdade} anos de contribuição`,
        "Valor do benefício: 60% + 2% por ano acima de 15 anos",
      ],
    });

    // Regra 2: Regra de Transição por Pontos
    const pontosNecessarios = sexo === "M" ? 100 : 90;
    const pontosAtuais = idade + tempoContribuicao;
    const pontosFuturos = idadeFutura + tempoFuturo;
    const elegivelPontos = pontosFuturos >= pontosNecessarios && tempoFuturo >= 30;

    resultados.push({
      regra: "Regra de Transição - Sistema de Pontos",
      elegivel: elegivelPontos,
      dataElegibilidade: elegivelPontos
        ? `Elegível em ${anosProjecao} anos`
        : `Faltam ${pontosNecessarios - pontosFuturos} pontos`,
      pontosAtuais: pontosFuturos,
      pontosNecessarios,
      tempoContribuicao: 30,
      observacoes: [
        `Pontos = Idade + Tempo de Contribuição`,
        `Pontos necessários: ${pontosNecessarios}`,
        `Tempo mínimo: 30 anos de contribuição`,
        "Benefício integral (100% da média)",
      ],
    });

    // Regra 3: Regra de Transição por Idade Progressiva
    const idadeMinimaProgressiva = sexo === "M" ? 63 : 58;
    const tempoMinimoProgressiva = sexo === "M" ? 35 : 30;
    const elegivelProgressiva = idadeFutura >= idadeMinimaProgressiva && tempoFuturo >= tempoMinimoProgressiva;

    resultados.push({
      regra: "Regra de Transição - Idade Progressiva",
      elegivel: elegivelProgressiva,
      dataElegibilidade: elegivelProgressiva
        ? `Elegível em ${anosProjecao} anos`
        : `Faltam ${Math.max(idadeMinimaProgressiva - idadeFutura, tempoMinimoProgressiva - tempoFuturo)} anos`,
      idadeMinima: idadeMinimaProgressiva,
      tempoContribuicao: tempoMinimoProgressiva,
      observacoes: [
        `Idade mínima: ${idadeMinimaProgressiva} anos (progressiva)`,
        `Tempo mínimo: ${tempoMinimoProgressiva} anos`,
        "Idade aumenta 6 meses por ano até 2031",
        "Benefício integral (100% da média)",
      ],
    });

    // Regra 4: Pedágio 50%
    const tempoFaltanteAntes = sexo === "M" ? 35 - tempoContribuicao : 30 - tempoContribuicao;
    const pedagio50 = tempoFaltanteAntes * 0.5;
    const tempoNecessarioPedagio50 = tempoContribuicao + tempoFaltanteAntes + pedagio50;
    const elegivelPedagio50 = tempoFuturo >= tempoNecessarioPedagio50 && tempoFaltanteAntes <= 2;

    resultados.push({
      regra: "Regra de Transição - Pedágio 50%",
      elegivel: elegivelPedagio50,
      dataElegibilidade: elegivelPedagio50
        ? `Elegível em ${anosProjecao} anos`
        : tempoFaltanteAntes > 2
        ? "Não aplicável (faltavam mais de 2 anos em 13/11/2019)"
        : `Faltam ${(tempoNecessarioPedagio50 - tempoFuturo).toFixed(1)} anos`,
      tempoContribuicao: Math.ceil(tempoNecessarioPedagio50),
      observacoes: [
        "Válido apenas se faltavam menos de 2 anos em 13/11/2019",
        `Tempo necessário: ${tempoNecessarioPedagio50.toFixed(1)} anos`,
        `Pedágio: ${(pedagio50).toFixed(1)} anos (50% do tempo faltante)`,
        "Fator previdenciário aplicado (reduz benefício)",
      ],
    });

    return resultados;
  };

  const resultados = calcularSimulacao();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Simulador de Aposentadoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select value={sexo} onValueChange={(v) => setSexo(v as "M" | "F")}>
                <SelectTrigger id="sexo" data-testid="select-sexo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-nascimento">Data de Nascimento</Label>
              <Input
                id="data-nascimento"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                placeholder="DD/MM/AAAA"
                data-testid="input-birthdate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idade">Idade Atual: {idade} anos</Label>
              <Slider
                id="idade"
                min={18}
                max={75}
                step={1}
                value={[idade]}
                onValueChange={(v) => setIdade(v[0])}
                data-testid="slider-age"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempo-contribuicao">
                Tempo de Contribuição: {tempoContribuicao} anos
              </Label>
              <Slider
                id="tempo-contribuicao"
                min={0}
                max={45}
                step={1}
                value={[tempoContribuicao]}
                onValueChange={(v) => setTempoContribuicao(v[0])}
                data-testid="slider-contribution"
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="projecao">
              Projetar para daqui a: {projecaoAnos[0]} anos
            </Label>
            <Slider
              id="projecao"
              min={0}
              max={15}
              step={1}
              value={projecaoAnos}
              onValueChange={setProjecaoAnos}
              data-testid="slider-projection"
            />
            <p className="text-xs text-muted-foreground">
              Idade projetada: {idade + projecaoAnos[0]} anos • Tempo de contribuição projetado:{" "}
              {tempoContribuicao + projecaoAnos[0]} anos
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Resultados da Simulação</h3>
        {resultados.map((resultado, index) => (
          <Card
            key={index}
            className={resultado.elegivel ? "border-success" : ""}
            data-testid={`simulation-result-${index}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {resultado.elegivel ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    {resultado.regra}
                  </CardTitle>
                </div>
                <Badge
                  variant={resultado.elegivel ? "default" : "outline"}
                  className={
                    resultado.elegivel
                      ? "bg-success/10 text-success border-success/20"
                      : ""
                  }
                >
                  {resultado.elegivel ? "Elegível" : "Não Elegível"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{resultado.dataElegibilidade}</span>
              </div>

              {resultado.pontosAtuais !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pontos</span>
                  <span className="font-medium tabular-nums">
                    {resultado.pontosAtuais} / {resultado.pontosNecessarios}
                  </span>
                </div>
              )}

              {resultado.idadeMinima !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Idade Mínima</span>
                  <span className="font-medium tabular-nums">
                    {resultado.idadeMinima} anos
                  </span>
                </div>
              )}

              {resultado.tempoContribuicao !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tempo Mínimo</span>
                  <span className="font-medium tabular-nums">
                    {resultado.tempoContribuicao} anos
                  </span>
                </div>
              )}

              {resultado.tempoFaltante && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 text-sm">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{resultado.tempoFaltante}</span>
                </div>
              )}

              <div className="pt-3 border-t space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Observações:
                </p>
                {resultado.observacoes.map((obs, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    • {obs}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
