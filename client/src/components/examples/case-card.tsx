import { CaseCard } from "../case-card";

export default function CaseCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-8 bg-background">
      <CaseCard
        id="1"
        clientName="Maria Silva Santos"
        status="analyzing"
        contributionTime="28 anos, 4 meses"
        pendingCount={3}
        lastUpdate="2 dias atrás"
        documentsCount={8}
      />
      <CaseCard
        id="2"
        clientName="João Pedro Oliveira"
        status="pending"
        contributionTime="32 anos, 1 mês"
        pendingCount={5}
        lastUpdate="1 semana atrás"
        documentsCount={12}
      />
      <CaseCard
        id="3"
        clientName="Ana Carolina Lima"
        status="completed"
        contributionTime="35 anos"
        pendingCount={0}
        lastUpdate="3 dias atrás"
        documentsCount={15}
      />
    </div>
  );
}
