import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Save, Plus } from "lucide-react";

export default function Configuracoes() {
  const [nome, setNome] = useState("Dr. Advogado");
  const [oab, setOab] = useState("OAB/SP 123456");
  const [email, setEmail] = useState("advogado@example.com");
  const [telefone, setTelefone] = useState("(11) 98765-4321");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações e preferências
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Perfil</TabsTrigger>
          <TabsTrigger value="branding" data-testid="tab-branding">Identidade Visual</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Seus dados serão incluídos automaticamente nos pareceres gerados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" data-testid="button-upload-photo">
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar Foto
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG ou PNG. Máximo 2MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    data-testid="input-nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oab">OAB</Label>
                  <Input
                    id="oab"
                    value={oab}
                    onChange={(e) => setOab(e.target.value)}
                    data-testid="input-oab"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    data-testid="input-telefone"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2" data-testid="button-save-profile">
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo e Identidade Visual</CardTitle>
              <CardDescription>
                Personalize a aparência dos seus pareceres
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Logo do Escritório</Label>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm" data-testid="button-upload-logo">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG com fundo transparente recomendado. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Assinatura Digital</Label>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-48 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm" data-testid="button-upload-signature">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Assinatura
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG com fundo transparente. Máximo 2MB.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Parecer</CardTitle>
              <CardDescription>
                Gerencie modelos de pareceres técnicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate cursor-pointer">
                  <div>
                    <p className="font-medium">Template DZAMB Padrão</p>
                    <p className="text-sm text-muted-foreground">Modelo oficial do curso</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-edit-template-1">
                    Editar
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate cursor-pointer">
                  <div>
                    <p className="font-medium">Template Personalizado</p>
                    <p className="text-sm text-muted-foreground">Seu modelo customizado</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-edit-template-2">
                    Editar
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="outline" data-testid="button-new-template">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
