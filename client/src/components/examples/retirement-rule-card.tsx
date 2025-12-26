import { RetirementRuleCard } from "../retirement-rule-card";

export default function RetirementRuleCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 p-8 bg-background max-w-6xl mx-auto">
      <RetirementRuleCard
        id="1"
        ruleName="Aposentadoria por Tempo de Contribuição"
        ruleDescription="35 anos de contribuição para homens"
        requirementsMet={420}
        requirementsTotal={420}
        projectedDate="Cumprida"
        estimatedBenefit="R$ 4.850,00"
        details={[
          { label: "Tempo de contribuição", current: "35 anos", required: "35 anos" },
          { label: "Carência", current: "180 meses", required: "180 meses" },
        ]}
      />
      <RetirementRuleCard
        id="2"
        ruleName="Regra de Transição 86/96"
        ruleDescription="Soma de idade + tempo de contribuição"
        requirementsMet={340}
        requirementsTotal={420}
        projectedDate="Março/2027"
        monthsRemaining={28}
        estimatedBenefit="R$ 5.120,00"
        details={[
          { label: "Idade atual", current: "58 anos", required: "60 anos" },
          { label: "Tempo de contribuição", current: "28 anos, 4 meses", required: "35 anos" },
          { label: "Pontos atuais", current: "86", required: "96" },
        ]}
      />
      <RetirementRuleCard
        id="3"
        ruleName="Aposentadoria por Idade"
        ruleDescription="65 anos de idade + 15 anos de contribuição"
        requirementsMet={180}
        requirementsTotal={180}
        projectedDate="Janeiro/2026"
        monthsRemaining={14}
        estimatedBenefit="R$ 3.200,00"
      />
      <RetirementRuleCard
        id="4"
        ruleName="Aposentadoria Especial"
        ruleDescription="25 anos de atividade especial"
        requirementsMet={240}
        requirementsTotal={300}
        projectedDate="Agosto/2029"
        monthsRemaining={60}
        estimatedBenefit="R$ 6.100,00"
        details={[
          { label: "Tempo especial", current: "20 anos", required: "25 anos" },
          { label: "PPP validado", current: "Sim", required: "Sim" },
        ]}
      />
    </div>
  );
}
