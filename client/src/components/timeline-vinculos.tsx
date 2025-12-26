import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface VinculoTimeline {
  id: string;
  empresa: string;
  inicio: Date;
  fim: Date | null;
  tipo: 'comum' | 'especial';
  remuneracao?: string;
}

interface TimelineVinculosProps {
  vinculos: VinculoTimeline[];
  onVinculoClick?: (vinculoId: string) => void;
}

export function TimelineVinculos({ vinculos, onVinculoClick }: TimelineVinculosProps) {
  const [selectedVinculo, setSelectedVinculo] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  if (vinculos.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum vínculo para exibir</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allDates = vinculos.flatMap(v => [v.inicio, v.fim]).filter(Boolean) as Date[];
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = vinculos.some(v => !v.fim) 
    ? new Date() 
    : new Date(Math.max(...allDates.map(d => d.getTime())));

  const totalMonths = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
                      (maxDate.getMonth() - minDate.getMonth());

  const getPosition = (date: Date) => {
    const months = (date.getFullYear() - minDate.getFullYear()) * 12 + 
                   (date.getMonth() - minDate.getMonth());
    return (months / totalMonths) * 100;
  };

  const getWidth = (vinculo: VinculoTimeline) => {
    const end = vinculo.fim || new Date();
    return getPosition(end) - getPosition(vinculo.inicio);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  const getDuration = (vinculo: VinculoTimeline) => {
    const end = vinculo.fim || new Date();
    const months = (end.getFullYear() - vinculo.inicio.getFullYear()) * 12 +
                   (end.getMonth() - vinculo.inicio.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      return `${years}a ${remainingMonths}m`;
    } else if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''}`;
    } else {
      return `${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Linha do Tempo dos Vínculos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Marcadores de Ano */}
          <div className="relative h-8 border-b border-border">
            {Array.from({ length: maxDate.getFullYear() - minDate.getFullYear() + 1 }, (_, i) => {
              const year = minDate.getFullYear() + i;
              const yearStart = new Date(year, 0, 1);
              const position = getPosition(yearStart);
              
              return (
                <div
                  key={year}
                  className="absolute top-0 h-full border-l border-border"
                  style={{ left: `${position}%` }}
                >
                  <span className="absolute -top-1 -translate-x-1/2 text-xs font-medium text-muted-foreground">
                    {year}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Vínculos */}
          <div className="space-y-4" style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left' }}>
            {vinculos.map((vinculo, index) => {
              const isSelected = selectedVinculo === vinculo.id;
              const left = getPosition(vinculo.inicio);
              const width = getWidth(vinculo);

              return (
                <div key={vinculo.id} className="relative h-16">
                  <div
                    className={`
                      absolute rounded-lg border-2 h-full cursor-pointer transition-all
                      ${vinculo.tipo === 'especial' 
                        ? 'bg-success/20 border-success hover:bg-success/30' 
                        : 'bg-primary/20 border-primary hover:bg-primary/30'
                      }
                      ${isSelected ? 'ring-2 ring-primary ring-offset-2 scale-105 shadow-lg z-10' : 'hover-elevate'}
                    `}
                    style={{ 
                      left: `${left}%`, 
                      width: `${width}%`,
                      minWidth: '80px'
                    }}
                    onClick={() => {
                      setSelectedVinculo(vinculo.id);
                      onVinculoClick?.(vinculo.id);
                    }}
                    data-testid={`timeline-vinculo-${vinculo.id}`}
                  >
                    <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold truncate flex-1">
                          {vinculo.empresa}
                        </p>
                        {vinculo.tipo === 'especial' && (
                          <Badge variant="outline" className="bg-success/20 text-success border-success text-[10px] px-1 py-0">
                            ESP
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>{formatDate(vinculo.inicio)}</span>
                          <span>→</span>
                          <span>{vinculo.fim ? formatDate(vinculo.fim) : 'Atual'}</span>
                        </div>
                        <div className="font-medium text-foreground">
                          {getDuration(vinculo)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detalhes do Vínculo Selecionado */}
          {selectedVinculo && (
            <div className="mt-6 p-4 rounded-lg border border-primary bg-primary/5">
              {(() => {
                const vinculo = vinculos.find(v => v.id === selectedVinculo);
                if (!vinculo) return null;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{vinculo.empresa}</h4>
                      <Badge variant="outline" className={
                        vinculo.tipo === 'especial'
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }>
                        {vinculo.tipo === 'especial' ? 'Tempo Especial' : 'Tempo Comum'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Início:</span>
                        <p className="font-medium">{vinculo.inicio.toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fim:</span>
                        <p className="font-medium">
                          {vinculo.fim ? vinculo.fim.toLocaleDateString('pt-BR') : 'Em andamento'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duração:</span>
                        <p className="font-medium">{getDuration(vinculo)}</p>
                      </div>
                      {vinculo.remuneracao && (
                        <div>
                          <span className="text-muted-foreground">Remuneração:</span>
                          <p className="font-medium">{vinculo.remuneracao}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
