import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsPopover } from "@/components/notifications-popover";
import { GlobalSearch } from "@/components/global-search";
import { Loader2 } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import Pareceres from "@/pages/pareceres";
import Configuracoes from "@/pages/configuracoes";
import Admin from "@/pages/admin";
import Planejamento from "@/pages/planejamento";
import PlanejamentoNovo from "@/pages/planejamento-novo";
import PlanejamentoDetalhes from "@/pages/planejamento-detalhes";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import Error403 from "@/pages/error-403";
import Error500 from "@/pages/error-500";
import { createContext, useContext, useEffect } from "react";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery<{ authenticated: boolean; user?: AuthUser }>({
    queryKey: ["/api/me"],
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const user = data?.user || null;
  const value: AuthContextType = {
    user,
    isAuthenticated: data?.authenticated || false,
    isLoading,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ProtectedRoute({ 
  component: Component
}: { 
  component: React.ComponentType;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/planejamento">
        <ProtectedRoute component={Planejamento} />
      </Route>
      <Route path="/planejamento/novo">
        <ProtectedRoute component={PlanejamentoNovo} />
      </Route>
      <Route path="/planejamento/:id">
        <ProtectedRoute component={PlanejamentoDetalhes} />
      </Route>
      <Route path="/pareceres">
        <ProtectedRoute component={Pareceres} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} />
      </Route>
      <Route path="/configuracoes">
        <ProtectedRoute component={Configuracoes} />
      </Route>
      <Route path="/403" component={Error403} />
      <Route path="/500" component={Error500} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();

  const isLoginPage = location === "/login";
  const isErrorPage = location === "/403" || location === "/500";

  if (isLoginPage || isErrorPage) {
    return <Router />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Router />;
  }

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar key={user?.id || 'no-user'} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="hidden sm:block flex-1 max-w-md">
                <GlobalSearch />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsPopover />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
