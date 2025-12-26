import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ServerCrash, RefreshCw, Home } from "lucide-react";
import { useLocation } from "wouter";
import { AnimatedPage, SlideUp, ScaleIn } from "@/components/animated-page";

export default function Error500() {
  const [, navigate] = useLocation();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <AnimatedPage>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-destructive/20">
          <CardContent className="pt-6 pb-8 text-center space-y-6">
            <ScaleIn>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full" />
                  <div className="relative bg-destructive/10 p-6 rounded-full">
                    <ServerCrash className="h-16 w-16 text-destructive" />
                  </div>
                </div>
              </div>
            </ScaleIn>

            <SlideUp delay={0.1}>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold font-serif">Erro 500</h1>
                <p className="text-xl text-muted-foreground">
                  Erro Interno do Servidor
                </p>
              </div>
            </SlideUp>

            <SlideUp delay={0.2}>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ops! Algo deu errado em nossos servidores. Nossa equipe já foi notificada e está trabalhando para resolver o problema.
              </p>
            </SlideUp>

            <SlideUp delay={0.3}>
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 text-left">
                    <div className="mt-0.5 text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium">O que você pode fazer:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Aguarde alguns minutos e tente novamente</li>
                        <li>• Recarregue a página</li>
                        <li>• Entre em contato com o suporte se o erro persistir</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SlideUp>

            <SlideUp delay={0.4}>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recarregar Página
                </Button>
                <Button
                  onClick={handleGoHome}
                  className="gap-2"
                  data-testid="button-home"
                >
                  <Home className="h-4 w-4" />
                  Voltar ao Início
                </Button>
              </div>
            </SlideUp>

            <SlideUp delay={0.5}>
              <p className="text-xs text-muted-foreground">
                Código de erro: 500 • {new Date().toLocaleString('pt-BR')}
              </p>
            </SlideUp>
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}
