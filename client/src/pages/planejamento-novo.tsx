import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, X } from "lucide-react";
import { Link } from "wouter";

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function PlanejamentoNovoPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [clienteNome, setClienteNome] = useState("");
  const [clienteCpf, setClienteCpf] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/planejamento/upload", {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao enviar documentos");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/planejamento"] });
      
      // Mensagem diferente se CNIS foi analisado
      const mensagem = data.cnisAnalisado
        ? `${data.filesUploaded} arquivo(s) enviado(s) e CNIS analisado automaticamente!`
        : `${data.filesUploaded} arquivo(s) processado(s)`;
      
      toast({
        title: "Documentos enviados com sucesso",
        description: mensagem,
      });
      navigate(`/planejamento/${data.planejamentoId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar documentos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const pdfFiles = newFiles.filter(f => f.type === "application/pdf");
      
      if (pdfFiles.length !== newFiles.length) {
        toast({
          title: "Apenas arquivos PDF",
          description: "Alguns arquivos foram ignorados. Apenas PDFs são permitidos.",
          variant: "destructive",
        });
      }
      
      setFiles(prev => [...prev, ...pdfFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const newFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = newFiles.filter(f => f.type === "application/pdf");
    
    if (pdfFiles.length !== newFiles.length) {
      toast({
        title: "Apenas arquivos PDF",
        description: "Alguns arquivos foram ignorados. Apenas PDFs são permitidos.",
        variant: "destructive",
      });
    }
    
    setFiles(prev => [...prev, ...pdfFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteNome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    if (!clienteCpf.trim()) {
      toast({
        title: "CPF obrigatório",
        description: "Por favor, informe o CPF do cliente.",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Documentos obrigatórios",
        description: "Por favor, envie ao menos um documento PDF.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("clienteNome", clienteNome);
    formData.append("clienteCpf", clienteCpf);
    
    files.forEach(file => {
      formData.append("documentos", file);
    });

    uploadMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/planejamento">
            <Button variant="ghost" size="icon" data-testid="button-voltar">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-novo-planejamento">
              Novo Planejamento
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-description">
              Envie os documentos do cliente para análise automatizada
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="heading-dados-cliente">Dados do Cliente</CardTitle>
              <CardDescription>Informações básicas para identificação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" data-testid="label-nome">Nome Completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Maria da Silva Santos"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  data-testid="input-nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf" data-testid="label-cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={clienteCpf}
                  onChange={(e) => setClienteCpf(formatCpf(e.target.value))}
                  maxLength={14}
                  data-testid="input-cpf"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle data-testid="heading-documentos">Documentos (PDF)</CardTitle>
              <CardDescription>
                CNIS, Holerites, CTPS, FGTS ou outros documentos previdenciários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                  }
                `}
                data-testid="dropzone-upload"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Arraste arquivos PDF aqui
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ou clique no botão abaixo para selecionar
                    </p>
                  </div>
                  <label htmlFor="file-upload">
                    <Button type="button" variant="outline" size="sm" asChild data-testid="button-selecionar-arquivos">
                      <span>Selecionar Arquivos</span>
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label data-testid="label-arquivos-selecionados">
                    Arquivos Selecionados ({files.length})
                  </Label>
                  <div className="space-y-2" data-testid="list-files">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        data-testid={`file-item-${index}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" data-testid={`text-filename-${index}`}>
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`text-filesize-${index}`}>
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          data-testid={`button-remove-file-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Link href="/planejamento">
              <Button type="button" variant="outline" data-testid="button-cancelar">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={uploadMutation.isPending}
              className="gap-2"
              data-testid="button-enviar"
            >
              {uploadMutation.isPending ? (
                <>Enviando e analisando...</>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar Documentos
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
