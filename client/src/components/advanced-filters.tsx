import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Filter, 
  X, 
  CalendarIcon,
  SlidersHorizontal,
  ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface FilterState {
  status: string;
  prioridade: string;
  tipoBeneficio: string;
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
  ordenacao: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  activeFilterCount: number;
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  activeFilterCount 
}: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleClearFilters = () => {
    onFiltersChange({
      status: "all",
      prioridade: "all",
      tipoBeneficio: "all",
      dataInicio: undefined,
      dataFim: undefined,
      ordenacao: "recente",
    });
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFilters = () => {
    const active: Array<{ key: string; label: string; value: string }> = [];
    
    if (filters.status !== "all") {
      const statusLabels: Record<string, string> = {
        analyzing: "Em Análise",
        pending: "Pendente",
        completed: "Concluído",
        draft: "Rascunho",
        archived: "Arquivado",
      };
      active.push({ 
        key: "status", 
        label: "Status", 
        value: statusLabels[filters.status] 
      });
    }

    if (filters.prioridade !== "all") {
      const prioridadeLabels: Record<string, string> = {
        alta: "Alta",
        media: "Média",
        baixa: "Baixa",
      };
      active.push({ 
        key: "prioridade", 
        label: "Prioridade", 
        value: prioridadeLabels[filters.prioridade] 
      });
    }

    if (filters.tipoBeneficio !== "all") {
      const tipoLabels: Record<string, string> = {
        idade: "Aposentadoria por Idade",
        tempo: "Aposentadoria por Tempo",
        especial: "Aposentadoria Especial",
        invalidez: "Aposentadoria por Invalidez",
      };
      active.push({ 
        key: "tipoBeneficio", 
        label: "Tipo", 
        value: tipoLabels[filters.tipoBeneficio] 
      });
    }

    if (filters.dataInicio) {
      active.push({ 
        key: "dataInicio", 
        label: "Data Início", 
        value: format(filters.dataInicio, "dd/MM/yyyy") 
      });
    }

    if (filters.dataFim) {
      active.push({ 
        key: "dataFim", 
        label: "Data Fim", 
        value: format(filters.dataFim, "dd/MM/yyyy") 
      });
    }

    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2"
              data-testid="button-filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="outline" className="ml-1 bg-primary/10 text-primary border-primary/20">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[380px] p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Filtros Avançados</h4>
                {activeFilterCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearFilters}
                    data-testid="button-clear-filters"
                  >
                    Limpar tudo
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Status
                  </label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(v) => updateFilter("status", v)}
                  >
                    <SelectTrigger data-testid="select-filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="analyzing">Em Análise</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Prioridade
                  </label>
                  <Select 
                    value={filters.prioridade} 
                    onValueChange={(v) => updateFilter("prioridade", v)}
                  >
                    <SelectTrigger data-testid="select-filter-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Tipo de Benefício
                  </label>
                  <Select 
                    value={filters.tipoBeneficio} 
                    onValueChange={(v) => updateFilter("tipoBeneficio", v)}
                  >
                    <SelectTrigger data-testid="select-filter-benefit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="idade">Aposentadoria por Idade</SelectItem>
                      <SelectItem value="tempo">Aposentadoria por Tempo</SelectItem>
                      <SelectItem value="especial">Aposentadoria Especial</SelectItem>
                      <SelectItem value="invalidez">Aposentadoria por Invalidez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Data Início
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-date-start"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dataInicio ? (
                            format(filters.dataInicio, "dd/MM/yyyy")
                          ) : (
                            <span className="text-muted-foreground">Selecionar</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dataInicio}
                          onSelect={(date) => updateFilter("dataInicio", date)}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Data Fim
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-date-end"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dataFim ? (
                            format(filters.dataFim, "dd/MM/yyyy")
                          ) : (
                            <span className="text-muted-foreground">Selecionar</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dataFim}
                          onSelect={(date) => updateFilter("dataFim", date)}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Select 
          value={filters.ordenacao} 
          onValueChange={(v) => updateFilter("ordenacao", v)}
        >
          <SelectTrigger className="w-[180px]" data-testid="select-sort">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recente">Mais Recentes</SelectItem>
            <SelectItem value="antigo">Mais Antigos</SelectItem>
            <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="prioridade">Prioridade</SelectItem>
            <SelectItem value="pendencias">Mais Pendências</SelectItem>
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="gap-2"
            data-testid="button-clear-all-filters"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filtros ativos:</span>
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.key} 
              variant="outline" 
              className="gap-1.5 bg-primary/5 hover:bg-primary/10 border-primary/20"
              data-testid={`badge-filter-${filter.key}`}
            >
              <span className="text-xs">
                <span className="font-medium">{filter.label}:</span> {filter.value}
              </span>
              <button
                onClick={() => {
                  if (filter.key === "dataInicio" || filter.key === "dataFim") {
                    updateFilter(filter.key, undefined);
                  } else {
                    updateFilter(filter.key as keyof FilterState, "all");
                  }
                }}
                className="hover:bg-primary/20 rounded-full p-0.5"
                data-testid={`button-remove-filter-${filter.key}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
