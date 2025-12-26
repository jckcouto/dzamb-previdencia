import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedPage } from "@/components/animated-page";
import { Users, UserCheck, TrendingUp, Briefcase, MessageSquare, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statCards = [
  {
    title: "Total de Usuários",
    value: "47",
    change: "+12%",
    trend: "up",
    icon: Users,
    description: "3 novos este mês",
  },
  {
    title: "Usuários Ativos",
    value: "42",
    change: "+8%",
    trend: "up",
    icon: UserCheck,
    description: "89% de ativação",
  },
  {
    title: "Casos Ativos",
    value: "156",
    change: "+23%",
    trend: "up",
    icon: Briefcase,
    description: "28 criados este mês",
  },
  {
    title: "Mensagens/Dia",
    value: "1.2k",
    change: "+15%",
    trend: "up",
    icon: MessageSquare,
    description: "Média dos últimos 7 dias",
  },
];

const recentUsers = [
  {
    id: "1",
    nome: "Dr. Carlos Silva",
    email: "carlos.silva@dzamb.com.br",
    role: "advogado",
    ultimoAcesso: "Há 2 minutos",
    ativo: true,
    casosAtivos: 12,
  },
  {
    id: "2",
    nome: "Dra. Ana Paula Santos",
    email: "ana.santos@dzamb.com.br",
    role: "advogado",
    ultimoAcesso: "Há 15 minutos",
    ativo: true,
    casosAtivos: 18,
  },
  {
    id: "3",
    nome: "Dr. Roberto Mendes",
    email: "roberto.mendes@dzamb.com.br",
    role: "advogado",
    ultimoAcesso: "Há 1 hora",
    ativo: true,
    casosAtivos: 9,
  },
  {
    id: "4",
    nome: "Julia Oliveira",
    email: "julia.oliveira@dzamb.com.br",
    role: "advogado",
    ultimoAcesso: "Há 3 horas",
    ativo: true,
    casosAtivos: 7,
  },
  {
    id: "5",
    nome: "Dr. Fernando Costa",
    email: "fernando.costa@dzamb.com.br",
    role: "advogado",
    ultimoAcesso: "Ontem",
    ativo: false,
    casosAtivos: 0,
  },
];

const roleLabels = {
  admin: "Administrador",
  advogado: "Advogado",
  cliente: "Cliente",
};

const roleBadgeClasses = {
  admin: "bg-primary/10 text-primary border-primary/20",
  advogado: "bg-info/10 text-info border-info/20",
  cliente: "bg-muted text-muted-foreground border-muted",
};

export default function Admin() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema DZAMB - CEO Dashboard
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover-elevate" data-testid={`stat-card-${index}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid={`stat-value-${index}`}>
                    {stat.value}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={
                        stat.trend === "up"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }
                      data-testid={`stat-change-${index}`}
                    >
                      {stat.change}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="usuarios" className="space-y-4">
          <TabsList data-testid="admin-tabs">
            <TabsTrigger value="usuarios" data-testid="tab-usuarios">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="atividade" data-testid="tab-atividade">
              Atividade
            </TabsTrigger>
            <TabsTrigger value="relatorios" data-testid="tab-relatorios">
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Recentes</CardTitle>
                <CardDescription>
                  Últimos acessos e status dos usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => {
                    const initials = user.nome
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-md hover-elevate"
                        data-testid={`user-row-${user.id}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{user.nome}</p>
                              <Badge
                                variant="outline"
                                className={roleBadgeClasses[user.role as keyof typeof roleBadgeClasses]}
                                data-testid={`badge-role-${user.id}`}
                              >
                                {roleLabels[user.role as keyof typeof roleLabels]}
                              </Badge>
                              {!user.ativo && (
                                <Badge
                                  variant="outline"
                                  className="bg-muted text-muted-foreground"
                                  data-testid={`badge-inactive-${user.id}`}
                                >
                                  Inativo
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {user.casosAtivos} casos
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.ultimoAcesso}
                            </p>
                          </div>
                          {user.ativo && (
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atividade" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Atividade do Sistema</CardTitle>
                <CardDescription>
                  Registro de ações e eventos dos últimos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      user: "Dr. Carlos Silva",
                      action: "criou 3 novos casos",
                      time: "Há 5 minutos",
                      icon: Briefcase,
                    },
                    {
                      user: "Dra. Ana Paula",
                      action: "enviou 24 mensagens",
                      time: "Há 12 minutos",
                      icon: MessageSquare,
                    },
                    {
                      user: "Sistema",
                      action: "processou 15 documentos CNIS",
                      time: "Há 1 hora",
                      icon: Activity,
                    },
                    {
                      user: "Dr. Roberto Mendes",
                      action: "atualizou 5 casos",
                      time: "Há 2 horas",
                      icon: TrendingUp,
                    },
                  ].map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                        data-testid={`activity-${index}`}
                      >
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span>{" "}
                            {activity.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios do Sistema</CardTitle>
                <CardDescription>
                  Análises e métricas detalhadas (em desenvolvimento)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Relatórios detalhados em breve
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AnimatedPage>
  );
}
