import { Home, FileText, FileCheck, Settings, Shield, Brain, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Planejamentos",
    url: "/planejamento",
    icon: Brain,
  },
  {
    title: "Pareceres",
    url: "/pareceres",
    icon: FileCheck,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

const adminItems = [
  {
    title: "Painel de Admin",
    url: "/admin",
    icon: Shield,
  },
];

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "US";
}

function getRoleLabel(role?: string): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "advogado":
      return "Usuário";
    case "cliente":
      return "Cliente";
    default:
      return "Usuário";
  }
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAdmin, isLoading, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
    window.location.href = "/login";
  };

  // Se há usuário, usar o role mesmo durante loading (evita flash de "Carregando...")
  const roleLabel = user ? (isAdmin ? "Administrador" : getRoleLabel(user.role)) : (isLoading ? "Carregando..." : "Usuário");
  const showAdmin = isAuthenticated && isAdmin && user;

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="text-center">
          <p className="text-xs text-sidebar-foreground/80 mb-1 tracking-wide">Do Zero ao</p>
          <h1 className="text-2xl font-bold text-primary leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Melhor
          </h1>
          <h1 className="text-2xl font-bold text-primary -mt-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            Benefício
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {showAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || "Avatar"} />}
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
              {getInitials(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-sidebar-foreground truncate" data-testid="text-user-name">
              {user?.name || user?.email || "Usuário"}
            </p>
            <Badge 
              variant="outline" 
              className={showAdmin ? "bg-primary/10 text-primary border-primary/20" : "bg-info/10 text-info border-info/20"}
              data-testid="badge-user-role"
            >
              {roleLabel}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
