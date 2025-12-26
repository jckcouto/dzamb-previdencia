import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  FolderOpen, 
  User,
  Clock,
  ArrowRight
} from "lucide-react";

interface SearchResult {
  id: string;
  type: 'caso' | 'cliente' | 'documento' | 'parecer';
  titulo: string;
  subtitulo?: string;
  url: string;
  status?: string;
  timestamp?: string;
}

const mockSearchData: SearchResult[] = [
  {
    id: "1",
    type: "caso",
    titulo: "Maria Silva Santos",
    subtitulo: "Em Análise • 3 pendências",
    url: "/casos/1",
    status: "analyzing",
    timestamp: "2 dias atrás",
  },
  {
    id: "2",
    type: "caso",
    titulo: "João Pedro Oliveira",
    subtitulo: "Pendente • 5 pendências",
    url: "/casos/2",
    status: "pending",
    timestamp: "1 semana atrás",
  },
  {
    id: "3",
    type: "caso",
    titulo: "Ana Carolina Lima",
    subtitulo: "Concluído",
    url: "/casos/3",
    status: "completed",
    timestamp: "3 dias atrás",
  },
  {
    id: "4",
    type: "documento",
    titulo: "CNIS - Maria Silva Santos",
    subtitulo: "Análise completa • 15 vínculos identificados",
    url: "/casos/1",
    timestamp: "2 dias atrás",
  },
  {
    id: "5",
    type: "documento",
    titulo: "CTPS - João Pedro Oliveira",
    subtitulo: "Pendente de verificação",
    url: "/casos/2",
    timestamp: "1 semana atrás",
  },
  {
    id: "6",
    type: "parecer",
    titulo: "Parecer Técnico - Ana Carolina",
    subtitulo: "Aposentadoria por Tempo de Contribuição",
    url: "/pareceres",
    timestamp: "3 dias atrás",
  },
  {
    id: "7",
    type: "cliente",
    titulo: "Carlos Eduardo Mendes",
    subtitulo: "cpf@email.com • (11) 98765-4321",
    url: "/casos/4",
  },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredResults = searchQuery.length === 0 
    ? mockSearchData.slice(0, 6) 
    : mockSearchData.filter((item) =>
        item.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitulo?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const resultsByCat = {
    casos: filteredResults.filter((r) => r.type === "caso"),
    documentos: filteredResults.filter((r) => r.type === "documento"),
    pareceres: filteredResults.filter((r) => r.type === "parecer"),
    clientes: filteredResults.filter((r) => r.type === "cliente"),
  };

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
    setSearchQuery("");
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "analyzing":
        return "bg-info/10 text-info border-info/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "completed":
        return "bg-success/10 text-success border-success/20";
      case "draft":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "analyzing":
        return "Em Análise";
      case "pending":
        return "Pendente";
      case "completed":
        return "Concluído";
      case "draft":
        return "Rascunho";
      default:
        return "";
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full sm:w-[300px] justify-start text-left font-normal text-muted-foreground"
        onClick={() => setOpen(true)}
        data-testid="button-global-search"
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Buscar casos, clientes...</span>
        <kbd className="pointer-events-none absolute right-2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Digite para buscar casos, clientes, documentos..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
          data-testid="input-global-search"
        />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum resultado encontrado</p>
            </div>
          </CommandEmpty>

          {resultsByCat.casos.length > 0 && (
            <>
              <CommandGroup heading="Casos">
                {resultsByCat.casos.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.titulo}
                    onSelect={() => handleSelect(result.url)}
                    className="cursor-pointer"
                    data-testid={`search-result-${result.id}`}
                  >
                    <FolderOpen className="mr-3 h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{result.titulo}</span>
                        {result.status && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(result.status)}`}
                          >
                            {getStatusLabel(result.status)}
                          </Badge>
                        )}
                      </div>
                      {result.subtitulo && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {result.subtitulo}
                        </p>
                      )}
                    </div>
                    {result.timestamp && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-3">
                        <Clock className="h-3 w-3" />
                        {result.timestamp}
                      </div>
                    )}
                    <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {resultsByCat.documentos.length > 0 && (
            <>
              <CommandGroup heading="Documentos">
                {resultsByCat.documentos.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.titulo}
                    onSelect={() => handleSelect(result.url)}
                    className="cursor-pointer"
                    data-testid={`search-result-${result.id}`}
                  >
                    <FileText className="mr-3 h-4 w-4 text-accent" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{result.titulo}</span>
                      {result.subtitulo && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {result.subtitulo}
                        </p>
                      )}
                    </div>
                    {result.timestamp && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-3">
                        <Clock className="h-3 w-3" />
                        {result.timestamp}
                      </div>
                    )}
                    <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {resultsByCat.pareceres.length > 0 && (
            <>
              <CommandGroup heading="Pareceres">
                {resultsByCat.pareceres.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.titulo}
                    onSelect={() => handleSelect(result.url)}
                    className="cursor-pointer"
                    data-testid={`search-result-${result.id}`}
                  >
                    <FileText className="mr-3 h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{result.titulo}</span>
                      {result.subtitulo && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {result.subtitulo}
                        </p>
                      )}
                    </div>
                    {result.timestamp && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-3">
                        <Clock className="h-3 w-3" />
                        {result.timestamp}
                      </div>
                    )}
                    <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {resultsByCat.clientes.length > 0 && (
            <CommandGroup heading="Clientes">
              {resultsByCat.clientes.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.titulo}
                  onSelect={() => handleSelect(result.url)}
                  className="cursor-pointer"
                  data-testid={`search-result-${result.id}`}
                >
                  <User className="mr-3 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{result.titulo}</span>
                    {result.subtitulo && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.subtitulo}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
