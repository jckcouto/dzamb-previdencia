import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CaseCard } from "@/components/case-card";
import { AdvancedFilters, type FilterState } from "@/components/advanced-filters";
import { AnimatedPage, AnimatedList, AnimatedCard } from "@/components/animated-page";
import { NewCaseDialog } from "@/components/new-case-dialog";
import { CaseCardSkeleton } from "@/components/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import type { Case } from "@shared/schema";

export default function Casos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    prioridade: "all",
    tipoBeneficio: "all",
    dataInicio: undefined,
    dataFim: undefined,
    ordenacao: "recente",
  });

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const filteredCases = cases.filter((caso) => {
    const matchesSearch = caso.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === "all";
    const matchesPrioridade = filters.prioridade === "all" || caso.prioridade === filters.prioridade;
    const matchesTipo = filters.tipoBeneficio === "all" || caso.tipoBeneficio === filters.tipoBeneficio;
    
    let matchesDateRange = true;
    if (filters.dataInicio && new Date(caso.dataUltimaAtualizacao) < filters.dataInicio) {
      matchesDateRange = false;
    }
    if (filters.dataFim && new Date(caso.dataUltimaAtualizacao) > filters.dataFim) {
      matchesDateRange = false;
    }

    return matchesSearch && matchesStatus && matchesPrioridade && matchesTipo && matchesDateRange;
  }).sort((a, b) => {
    switch (filters.ordenacao) {
      case "recente":
        return new Date(b.dataUltimaAtualizacao).getTime() - new Date(a.dataUltimaAtualizacao).getTime();
      case "antigo":
        return new Date(a.dataUltimaAtualizacao).getTime() - new Date(b.dataUltimaAtualizacao).getTime();
      case "nome-asc":
        return a.titulo.localeCompare(b.titulo);
      case "nome-desc":
        return b.titulo.localeCompare(a.titulo);
      case "prioridade":
        const prioridadeOrder = { alta: 0, média: 1, baixa: 2 };
        return prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder] - 
               prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder];
      case "pendencias":
        return 0;
      default:
        return 0;
    }
  });

  const activeFilterCount = [
    filters.status !== "all",
    filters.prioridade !== "all",
    filters.tipoBeneficio !== "all",
    filters.dataInicio !== undefined,
    filters.dataFim !== undefined,
  ].filter(Boolean).length;

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Casos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os casos dos seus clientes
            </p>
          </div>
          <NewCaseDialog />
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          
          <AdvancedFilters 
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CaseCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <AnimatedList staggerDelay={0.05}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCases.map((caso, index) => (
                  <AnimatedCard key={caso.id} delay={index * 0.05}>
                    <CaseCard 
                      id={caso.id}
                      clientName={caso.titulo}
                      status="analyzing"
                      contributionTime="N/A"
                      pendingCount={0}
                      lastUpdate={new Date(caso.dataUltimaAtualizacao).toLocaleDateString('pt-BR')}
                      documentsCount={caso.documentosUpload || 0}
                      prioridade={caso.prioridade}
                      tipoBeneficio={caso.tipoBeneficio || ''}
                      dataAtualizacao={new Date(caso.dataUltimaAtualizacao)}
                    />
                  </AnimatedCard>
                ))}
              </div>
            </AnimatedList>

            {filteredCases.length === 0 && (
              <div className="text-center py-12 animate-fade-in">
                <p className="text-muted-foreground">Nenhum caso encontrado com os filtros aplicados</p>
              </div>
            )}
          </>
        )}
      </div>
    </AnimatedPage>
  );
}
