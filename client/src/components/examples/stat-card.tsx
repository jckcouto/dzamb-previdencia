import { StatCard } from "../stat-card";
import { Users, FolderOpen, AlertCircle, CheckCircle } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-8 bg-background">
      <StatCard
        title="Total de Casos"
        value={127}
        description="Casos ativos"
        icon={FolderOpen}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Clientes"
        value={89}
        description="Clientes cadastrados"
        icon={Users}
      />
      <StatCard
        title="Pendências"
        value={43}
        description="Requerem atenção"
        icon={AlertCircle}
      />
      <StatCard
        title="Concluídos"
        value={84}
        description="Este mês"
        icon={CheckCircle}
        trend={{ value: 8, isPositive: true }}
      />
    </div>
  );
}
