import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedPage } from "@/components/animated-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  QrCode, 
  Cloud, 
  Smartphone, 
  MessageSquare,
  Activity,
  Users,
  Check,
  Loader2,
  ExternalLink,
  XCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppConfig {
  configured: boolean;
  appId?: string;
  configId?: string;
  message?: string;
}

interface WhatsAppConnection {
  connected: boolean;
  connection?: {
    wabaId: string;
    phoneNumberId: string;
    displayPhoneNumber: string;
    verifiedName: string;
    connectedAt: string;
  };
}

const mockQRCode = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WhatsAppDZAMB";

export default function WhatsApp() {
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [fbSdkReady, setFbSdkReady] = useState(false);
  const { toast } = useToast();

  // Fetch WhatsApp configuration
  const { data: config } = useQuery<WhatsAppConfig>({
    queryKey: ["/api/whatsapp/config"],
  });

  // Fetch connection status
  const { data: connectionData, isLoading: connectionLoading } = useQuery<WhatsAppConnection>({
    queryKey: ["/api/whatsapp/connection"],
    refetchInterval: isConnecting ? 2000 : false,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/whatsapp/connection", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connection"] });
      toast({
        title: "WhatsApp desconectado",
        description: "Sua conta foi desconectada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao desconectar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load Facebook SDK
  useEffect(() => {
    if (!config?.configured || !config.appId) {
      setFbSdkReady(false);
      return;
    }

    // Load Facebook SDK
    (window as any).fbAsyncInit = function() {
      (window as any).FB.init({
        appId: config.appId,
        cookie: true,
        xfbml: true,
        version: 'v20.0'
      });
      setFbSdkReady(true);
      console.log("Facebook SDK ready");
    };

    // Load SDK script
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        // SDK already loaded
        if ((window as any).FB) {
          setFbSdkReady(true);
        }
        return;
      }
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/pt_BR/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, [config]);

  // Handle Meta OAuth login
  const handleConnectWithMeta = () => {
    if (!config?.configId) {
      toast({
        title: "Configuração ausente",
        description: "Configure WHATSAPP_CONFIGURATION_ID nas variáveis de ambiente.",
        variant: "destructive",
      });
      return;
    }

    if (!fbSdkReady || !(window as any).FB) {
      toast({
        title: "SDK não carregado",
        description: "O Facebook SDK ainda está carregando. Aguarde alguns segundos e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    // Get current URL as redirect_uri
    const redirectUri = window.location.origin + window.location.pathname;

    (window as any).FB.login(function(response: any) {
      if (response.authResponse) {
        const code = response.authResponse.code;
        
        // Exchange code for token (MUST include redirect_uri)
        apiRequest("/api/whatsapp/exchange-token", {
          method: "POST",
          body: JSON.stringify({ 
            code,
            redirectUri // CRITICAL: Must match the implicit redirect_uri used by FB.login
          }),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connection"] });
            setIsConnecting(false);
            toast({
              title: "Conectado com sucesso!",
              description: "Sua conta WhatsApp Business está configurada.",
            });
          })
          .catch((error: any) => {
            setIsConnecting(false);
            toast({
              title: "Erro ao conectar",
              description: error.message || "Não foi possível completar a autenticação.",
              variant: "destructive",
            });
          });
      } else {
        setIsConnecting(false);
      }
    }, {
      config_id: config.configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: 2
      }
    });
  };

  const isConnected = connectionData?.connected;

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">WhatsApp Business</h1>
            <p className="text-muted-foreground mt-1">
              Conecte sua conta WhatsApp Business para atendimento integrado
            </p>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <Check className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          )}
        </div>

        {isConnected && connectionData.connection && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 md:grid-cols-4"
          >
            <Card className="hover-elevate" data-testid="stat-card-status">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Activity className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-semibold">Ativo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  API Cloud conectada
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="stat-card-phone">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Número</CardTitle>
                <Smartphone className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {connectionData.connection.displayPhoneNumber}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {connectionData.connection.verifiedName}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="stat-card-waba">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">WABA ID</CardTitle>
                <Cloud className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-xs font-mono truncate">
                  {connectionData.connection.wabaId}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  WhatsApp Business Account
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="stat-card-connected">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conectado em</CardTitle>
                <Users className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {new Date(connectionData.connection.connectedAt).toLocaleDateString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(connectionData.connection.connectedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="cloud-api" className="space-y-4">
          <TabsList data-testid="whatsapp-tabs">
            <TabsTrigger value="cloud-api" data-testid="tab-cloud-api">
              <Cloud className="h-4 w-4 mr-2" />
              API Cloud (Meta)
            </TabsTrigger>
            <TabsTrigger value="qrcode" data-testid="tab-qrcode">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code (Personal)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cloud-api" className="space-y-4">
            <AnimatePresence mode="wait">
              {!isConnected ? (
                <motion.div
                  key="not-connected"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Conectar com Meta</CardTitle>
                      <CardDescription>
                        Autentique-se diretamente com sua conta Meta/Facebook para configurar WhatsApp Business
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {!config?.configured ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8"
                        >
                          <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Configuração Necessária</h3>
                          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            {config?.message || "Configure as variáveis de ambiente do WhatsApp para continuar."}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" asChild>
                              <a 
                                href="https://developers.facebook.com/apps" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                data-testid="link-meta-developers"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Meta Developer Portal
                              </a>
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-center py-8"
                        >
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                            <Cloud className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">Conecte sua conta</h3>
                          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            Clique no botão abaixo para iniciar a autenticação com Meta. Você poderá selecionar ou criar 
                            uma WhatsApp Business Account (WABA) diretamente no fluxo.
                          </p>
                          <Button 
                            size="lg" 
                            onClick={handleConnectWithMeta}
                            disabled={isConnecting || !fbSdkReady}
                            data-testid="button-connect-meta"
                            className="min-w-[200px]"
                          >
                            {!fbSdkReady ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Carregando SDK...
                              </>
                            ) : isConnecting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Conectando...
                              </>
                            ) : (
                              <>
                                <Cloud className="h-4 w-4 mr-2" />
                                Conectar com Meta
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}

                      <div className="border-t pt-6">
                        <h4 className="font-semibold mb-3">Como funciona:</h4>
                        <ol className="space-y-3 text-sm text-muted-foreground">
                          <li className="flex gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex-shrink-0">1</span>
                            <span>Faça login com sua conta Facebook/Meta</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex-shrink-0">2</span>
                            <span>Selecione ou crie um Business Manager</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex-shrink-0">3</span>
                            <span>Escolha ou crie uma WhatsApp Business Account (WABA)</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex-shrink-0">4</span>
                            <span>Adicione e verifique seu número de telefone</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex-shrink-0">5</span>
                            <span>Pronto! Sua conexão estará ativa instantaneamente</span>
                          </li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-success" />
                        Conexão Ativa
                      </CardTitle>
                      <CardDescription>
                        Sua conta WhatsApp Business está conectada e pronta para uso
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid gap-4"
                      >
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-semibold">{connectionData.connection?.verifiedName}</div>
                            <div className="text-sm text-muted-foreground">{connectionData.connection?.displayPhoneNumber}</div>
                          </div>
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            Verificado
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="text-sm font-medium">WhatsApp Business Account ID</div>
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              {connectionData.connection?.wabaId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="text-sm font-medium">Phone Number ID</div>
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              {connectionData.connection?.phoneNumberId}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connection"] })}
                          data-testid="button-refresh-connection"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Atualizar
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => disconnectMutation.mutate()}
                          disabled={disconnectMutation.isPending}
                          data-testid="button-disconnect"
                        >
                          {disconnectMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Desconectando...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Desconectar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="qrcode" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conexão via QR Code</CardTitle>
                <CardDescription>
                  Conecte seu WhatsApp pessoal escaneando o QR Code (não recomendado para uso comercial)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!qrCodeGenerated ? (
                  <div className="text-center py-8">
                    <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Pronto para conectar?</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      Clique no botão abaixo para gerar um QR Code. Depois, abra o WhatsApp no seu celular,
                      vá em Configurações → Aparelhos conectados → Conectar um aparelho e escaneie o código.
                    </p>
                    <Button onClick={() => setQrCodeGenerated(true)} data-testid="button-generate-qr">
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="inline-block p-4 bg-white rounded-lg mb-4"
                    >
                      <img
                        src={mockQRCode}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64"
                        data-testid="qr-code-image"
                      />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">Escaneie o QR Code</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Abra o WhatsApp no seu celular e escaneie este código
                    </p>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Aguardando conexão...
                    </Badge>
                    <div className="mt-6">
                      <Button variant="outline" onClick={() => setQrCodeGenerated(false)} data-testid="button-regenerate-qr">
                        Gerar Novo Código
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3">Instruções:</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">1.</span>
                      Abra o WhatsApp no seu celular
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">2.</span>
                      Toque em Mais opções (⋮) → Aparelhos conectados
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">3.</span>
                      Toque em Conectar um aparelho
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">4.</span>
                      Aponte a câmera para o QR Code nesta tela
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AnimatedPage>
  );
}
