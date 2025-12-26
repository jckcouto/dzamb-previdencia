import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, Search, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { AnimatedPage, SlideUp, ScaleIn } from "@/components/animated-page";

export default function NotFound() {
  const [, navigate] = useLocation();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleSearch = () => {
    navigate("/casos");
  };

  return (
    <AnimatedPage>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 pb-8 text-center space-y-6">
            <ScaleIn>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="relative bg-primary/10 p-6 rounded-full">
                    <FileQuestion className="h-16 w-16 text-primary" />
                  </div>
                </div>
              </div>
            </ScaleIn>

            <SlideUp delay={0.1}>
              <div className="space-y-2">
                <h1 className="text-6xl font-bold font-serif">404</h1>
                <p className="text-xl text-muted-foreground">
                  Página Não Encontrada
                </p>
              </div>
            </SlideUp>

            <SlideUp delay={0.2}>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                A página que você está procurando não existe ou foi movida para outro endereço. Verifique o URL ou use os botões abaixo para navegar.
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
                      <p className="text-sm font-medium">Sugestões:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Verifique se o endereço foi digitado corretamente</li>
                        <li>• Use a busca para encontrar o que procura</li>
                        <li>• Volte para a página inicial</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SlideUp>

            <SlideUp delay={0.4}>
              <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={handleSearch}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  data-testid="button-search"
                >
                  <Search className="h-4 w-4" />
                  Buscar Casos
                </Button>
                <Button
                  onClick={handleGoHome}
                  size="sm"
                  className="gap-2"
                  data-testid="button-home"
                >
                  <Home className="h-4 w-4" />
                  Ir para Início
                </Button>
              </div>
            </SlideUp>
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}
