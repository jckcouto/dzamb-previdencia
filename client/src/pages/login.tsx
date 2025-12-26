import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, LogIn, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import backgroundVideo from "@assets/generated_videos/happy_office_workers_doing_retirement_planning.mp4";
import dzambLogo from "@assets/image_1764968240509.png";

interface AuthResponse {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: auth, isLoading } = useQuery<AuthResponse>({
    queryKey: ["/api/me"],
    refetchOnWindowFocus: true,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/login");
      return response.json();
    },
    onSuccess: () => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      console.error("Erro no login:", error);
      setErrorMessage("Não foi possível conectar ao servidor. Tente novamente.");
    },
  });

  useEffect(() => {
    if (auth?.authenticated) {
      setLocation("/");
    }
  }, [auth, setLocation]);

  const handleEntrar = () => {
    loginMutation.mutate();
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        data-testid="video-background"
      >
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      
      <div className="absolute inset-0 bg-background/60 pointer-events-none" />
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={dzambLogo} 
              alt="DZAMB Previdência" 
              className="h-24 w-auto object-contain"
              data-testid="img-logo"
            />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-title">DZAMB Previdência</CardTitle>
          <CardDescription className="text-base">
            Plataforma de Planejamento Previdenciário
          </CardDescription>
          <p className="text-sm text-primary font-medium italic">
            "Do Zero ao Melhor Benefício"
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" data-testid="alert-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleEntrar}
              className="w-full gap-2"
              size="lg"
              disabled={loginMutation.isPending}
              data-testid="button-entrar"
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loginMutation.isPending ? "Entrando..." : "Entrar no Sistema"}
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-center text-muted-foreground">
              Sistema de análise automatizada de documentos previdenciários
              <br />
              com inteligência artificial.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
