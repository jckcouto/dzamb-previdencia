import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, FolderOpen } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const casosPorStatusData = [
  { status: "Em Análise", count: 45, fill: "hsl(var(--info))" },
  { status: "Pendente", count: 32, fill: "hsl(var(--warning))" },
  { status: "Concluído", count: 84, fill: "hsl(var(--success))" },
  { status: "Rascunho", count: 12, fill: "hsl(var(--muted))" },
];

const casosPorMesData = [
  { mes: "Jul", criados: 12, concluidos: 8 },
  { mes: "Ago", criados: 18, concluidos: 15 },
  { mes: "Set", criados: 24, concluidos: 20 },
  { mes: "Out", criados: 30, concluidos: 28 },
];

const tempoMedioPorEtapaData = [
  { etapa: "Upload", dias: 1 },
  { etapa: "Análise", dias: 3 },
  { etapa: "Simulação", dias: 2 },
  { etapa: "Parecer", dias: 1 },
];

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
}

function StatsCard({ title, value, change, icon: Icon }: StatsCardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <p className={`text-xs mt-1 flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? '+' : ''}{change}% em relação ao mês anterior
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardCharts() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Casos"
          value={173}
          change={12}
          icon={FolderOpen}
        />
        <StatsCard
          title="Casos Concluídos"
          value={84}
          change={8}
          icon={FolderOpen}
        />
        <StatsCard
          title="Novos Clientes"
          value={23}
          change={15}
          icon={Users}
        />
        <StatsCard
          title="Taxa de Sucesso"
          value="94%"
          change={3}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Casos por Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Casos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={casosPorMesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="criados" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Criados"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="concluidos" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  name="Concluídos"
                  dot={{ fill: 'hsl(var(--success))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Casos por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Casos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={casosPorStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {casosPorStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tempo Médio por Etapa (dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tempoMedioPorEtapaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="etapa" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar 
                dataKey="dias" 
                fill="hsl(var(--primary))"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
