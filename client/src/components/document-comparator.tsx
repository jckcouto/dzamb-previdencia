import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
} from "lucide-react";

interface DocumentField {
  campo: string;
  valorDoc1: string;
  valorDoc2: string;
  status: "match" | "mismatch" | "missing";
}

const mockDocuments = [
  { id: "cnis", nome: "CNIS - Maria Silva" },
  { id: "ctps", nome: "CTPS - Maria Silva" },
  { id: "fgts", nome: "Extrato FGTS" },
  { id: "ppp", nome: "PPP - Empresa ABC" },
];

const mockComparison: DocumentField[] = [
  {
    campo: "Nome Completo",
    valorDoc1: "MARIA SILVA SANTOS",
    valorDoc2: "MARIA SILVA SANTOS",
    status: "match",
  },
  {
    campo: "CPF",
    valorDoc1: "123.456.789-00",
    valorDoc2: "123.456.789-00",
    status: "match",
  },
  {
    campo: "Data de Nascimento",
    valorDoc1: "15/03/1968",
    valorDoc2: "15/03/1968",
    status: "match",
  },
  {
    campo: "Empresa ABC Ltda - Início",
    valorDoc1: "01/01/2015",
    valorDoc2: "15/01/2015",
    status: "mismatch",
  },
  {
    campo: "Empresa ABC Ltda - Fim",
    valorDoc1: "31/12/2020",
    valorDoc2: "Não consta",
    status: "mismatch",
  },
  {
    campo: "Empresa ABC Ltda - Remuneração",
    valorDoc1: "R$ 3.200,00",
    valorDoc2: "R$ 3.500,00",
    status: "mismatch",
  },
  {
    campo: "XYZ Comércio S.A. - Início",
    valorDoc1: "01/01/2021",
    valorDoc2: "01/01/2021",
    status: "match",
  },
  {
    campo: "XYZ Comércio S.A. - Remuneração",
    valorDoc1: "R$ 4.500,00",
    valorDoc2: "Não consta",
    status: "missing",
  },
];

export function DocumentComparator() {
  const [doc1, setDoc1] = useState("cnis");
  const [doc2, setDoc2] = useState("ctps");
  const [viewMode, setViewMode] = useState<"all" | "mismatch">("all");

  const filteredComparison =
    viewMode === "all"
      ? mockComparison
      : mockComparison.filter((field) => field.status !== "match");

  const matchCount = mockComparison.filter((f) => f.status === "match").length;
  const mismatchCount = mockComparison.filter((f) => f.status === "mismatch").length;
  const missingCount = mockComparison.filter((f) => f.status === "missing").length;

  const getStatusIcon = (status: DocumentField["status"]) => {
    switch (status) {
      case "match":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "mismatch":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "missing":
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: DocumentField["status"]) => {
    switch (status) {
      case "match":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Igual
          </Badge>
        );
      case "mismatch":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            Divergência
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            Ausente
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Seleção de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Documento 1</label>
              <Select value={doc1} onValueChange={setDoc1}>
                <SelectTrigger data-testid="select-doc1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Documento 2</label>
              <Select value={doc2} onValueChange={setDoc2}>
                <SelectTrigger data-testid="select-doc2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("all")}
              data-testid="button-view-all"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Tudo
            </Button>
            <Button
              variant={viewMode === "mismatch" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("mismatch")}
              data-testid="button-view-mismatch"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Apenas Divergências
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Iguais</span>
              </div>
              <span className="text-2xl font-bold tabular-nums">{matchCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium">Divergências</span>
              </div>
              <span className="text-2xl font-bold tabular-nums">{mismatchCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium">Ausentes</span>
              </div>
              <span className="text-2xl font-bold tabular-nums">{missingCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparação Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredComparison.map((field, index) => (
              <div
                key={index}
                className="grid gap-3 p-4 rounded-lg border"
                data-testid={`comparison-row-${index}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(field.status)}
                    <span className="font-medium text-sm truncate">{field.campo}</span>
                  </div>
                  {getStatusBadge(field.status)}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {mockDocuments.find((d) => d.id === doc1)?.nome}
                    </p>
                    <p className="text-sm font-medium break-words">{field.valorDoc1}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {mockDocuments.find((d) => d.id === doc2)?.nome}
                    </p>
                    <p
                      className={`text-sm font-medium break-words ${
                        field.status !== "match" ? "text-warning" : ""
                      }`}
                    >
                      {field.valorDoc2}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredComparison.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-3" />
              <p className="text-sm text-muted-foreground">
                Todos os campos estão em conformidade!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
