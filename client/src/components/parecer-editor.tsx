import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Image as ImageIcon,
  FileText,
  Save,
  Download,
  Eye,
  Undo,
  Redo,
  Type,
} from "lucide-react";

interface ParecerEditorProps {
  initialContent?: string;
  clientName?: string;
  caseName?: string;
  onSave?: (content: string) => void;
  onExport?: () => void;
}

export function ParecerEditor({
  initialContent = "",
  clientName = "Cliente",
  caseName = "Caso",
  onSave,
  onExport,
}: ParecerEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'editor' | 'components'>('editor');

  const toolbar: Array<{ icon?: any; label?: string; action?: () => void; type?: string }> = [
    { icon: Undo, label: "Desfazer", action: () => console.log('Undo') },
    { icon: Redo, label: "Refazer", action: () => console.log('Redo') },
    { type: 'separator' },
    { icon: Heading1, label: "Título 1", action: () => console.log('H1') },
    { icon: Heading2, label: "Título 2", action: () => console.log('H2') },
    { type: 'separator' },
    { icon: Bold, label: "Negrito", action: () => console.log('Bold') },
    { icon: Italic, label: "Itálico", action: () => console.log('Italic') },
    { icon: Underline, label: "Sublinhado", action: () => console.log('Underline') },
    { type: 'separator' },
    { icon: AlignLeft, label: "Alinhar Esquerda", action: () => console.log('Left') },
    { icon: AlignCenter, label: "Centralizar", action: () => console.log('Center') },
    { icon: AlignRight, label: "Alinhar Direita", action: () => console.log('Right') },
    { type: 'separator' },
    { icon: List, label: "Lista", action: () => console.log('List') },
    { icon: ListOrdered, label: "Lista Numerada", action: () => console.log('OrderedList') },
    { icon: Quote, label: "Citação", action: () => console.log('Quote') },
    { type: 'separator' },
    { icon: ImageIcon, label: "Inserir Imagem", action: () => console.log('Image') },
  ];

  const templateComponents = [
    { id: 'header', name: 'Cabeçalho', type: 'layout', description: 'Logo e dados do advogado' },
    { id: 'client-info', name: 'Dados do Cliente', type: 'data', description: 'Nome, CPF, dados pessoais' },
    { id: 'case-summary', name: 'Resumo do Caso', type: 'data', description: 'Tempo de contribuição, status' },
    { id: 'vinculos', name: 'Tabela de Vínculos', type: 'table', description: 'Todos os vínculos identificados' },
    { id: 'pendencias', name: 'Pendências', type: 'list', description: 'Lista de pendências identificadas' },
    { id: 'regras', name: 'Regras de Aposentadoria', type: 'data', description: 'Análise de regras aplicáveis' },
    { id: 'rmi', name: 'Cálculo de RMI', type: 'table', description: 'Renda Mensal Inicial estimada' },
    { id: 'conclusao', name: 'Conclusão', type: 'text', description: 'Parecer técnico final' },
    { id: 'signature', name: 'Assinatura', type: 'layout', description: 'Assinatura e carimbo' },
  ];

  const mockTemplate = `
PARECER TÉCNICO PREVIDENCIÁRIO

Cliente: ${clientName}
Caso: ${caseName}
Data: ${new Date().toLocaleDateString('pt-BR')}

1. INTRODUÇÃO

Este parecer técnico tem por objetivo analisar a situação previdenciária do(a) Sr(a). ${clientName}, verificando os requisitos para concessão de aposentadoria.

2. ANÁLISE DOCUMENTAL

Após análise dos documentos apresentados (CNIS, CTPS, extratos FGTS), identificamos os seguintes vínculos laborais:

[INSERIR TABELA DE VÍNCULOS]

3. TEMPO DE CONTRIBUIÇÃO

Tempo total de contribuição: [INSERIR DADOS]
Tempo especial: [INSERIR DADOS]

4. REGRAS APLICÁVEIS

[INSERIR ANÁLISE DAS REGRAS]

5. CONCLUSÃO

[INSERIR CONCLUSÃO]

___________________________________
[NOME DO ADVOGADO]
OAB/XX XXXXX
`;

  const insertComponent = (componentId: string) => {
    const component = templateComponents.find(c => c.id === componentId);
    if (component) {
      setContent(prev => prev + `\n\n[${component.name.toUpperCase()}]\n\n`);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editor de Parecer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              data-testid="button-toggle-preview"
            >
              <Eye className="h-4 w-4 mr-1" />
              {isPreview ? 'Editor' : 'Preview'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSave?.(content)}
              data-testid="button-save-draft"
            >
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button
              size="sm"
              onClick={onExport}
              data-testid="button-export-pdf"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          {!isPreview && (
            <div className="p-2 border-b border-border bg-muted/30 flex flex-wrap gap-1">
              {toolbar.map((item, index) => {
                if (item.type === 'separator') {
                  return <div key={`sep-${index}`} className="w-px h-8 bg-border mx-1" />;
                }
                if (!item.icon) return null;
                const Icon = item.icon;
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={item.action}
                    title={item.label}
                    data-testid={`toolbar-${item.label?.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {isPreview ? (
              <ScrollArea className="h-full">
                <div className="p-8 max-w-4xl mx-auto">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
                  />
                </div>
              </ScrollArea>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full p-8 resize-none bg-background text-foreground font-mono text-sm focus:outline-none"
                placeholder="Digite o conteúdo do parecer aqui..."
                data-testid="textarea-content"
              />
            )}
          </div>
        </div>

        {/* Sidebar - Componentes */}
        <div className="w-80 border-l border-border bg-muted/30">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList className="w-full rounded-none border-b border-border">
              <TabsTrigger value="editor" className="flex-1" data-testid="tab-editor-settings">
                <Type className="h-4 w-4 mr-1" />
                Edição
              </TabsTrigger>
              <TabsTrigger value="components" className="flex-1" data-testid="tab-components">
                <FileText className="h-4 w-4 mr-1" />
                Componentes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="m-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Template</Label>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setContent(mockTemplate)}
                      data-testid="button-load-template"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Carregar Template DZAMB
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-name">Nome do Cliente</Label>
                    <Input
                      id="client-name"
                      defaultValue={clientName}
                      placeholder="Nome completo"
                      data-testid="input-client-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="case-name">Número do Caso</Label>
                    <Input
                      id="case-name"
                      defaultValue={caseName}
                      placeholder="Ex: 001/2024"
                      data-testid="input-case-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estatísticas</Label>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Palavras:</span>
                        <span className="font-medium tabular-nums">
                          {content.split(/\s+/).filter(Boolean).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Caracteres:</span>
                        <span className="font-medium tabular-nums">{content.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Linhas:</span>
                        <span className="font-medium tabular-nums">
                          {content.split('\n').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="components" className="m-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-4 space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    Clique para inserir componentes no parecer
                  </p>
                  {templateComponents.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => insertComponent(component.id)}
                      className="w-full p-3 rounded-lg border border-border bg-background hover-elevate active-elevate-2 text-left transition-all"
                      data-testid={`component-${component.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm">{component.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {component.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {component.description}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  );
}
