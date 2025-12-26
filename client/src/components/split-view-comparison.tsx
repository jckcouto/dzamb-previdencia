import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle, Link2, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Vinculo {
  id: string;
  empresa: string;
  inicio: string;
  fim: string;
  remuneracao?: string;
  fonte: 'cnis' | 'ctps' | 'fgts';
  correspondencia?: string;
  score?: number;
  divergencias?: string[];
}

interface SplitViewComparisonProps {
  vinculosCNIS: Vinculo[];
  vinculosDocumento: Vinculo[];
  documentoTipo: string;
  onAceitarVinculo?: (cnisId: string, docId: string) => void;
  onRejeitarVinculo?: (cnisId: string, docId: string) => void;
  onEditarVinculo?: (vinculoId: string) => void;
}

export function SplitViewComparison({
  vinculosCNIS,
  vinculosDocumento,
  documentoTipo,
  onAceitarVinculo,
  onRejeitarVinculo,
  onEditarVinculo,
}: SplitViewComparisonProps) {
  const [selectedCNIS, setSelectedCNIS] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [splitPosition, setSplitPosition] = useState(50);

  const handleDrag = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      const container = e.currentTarget.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const position = ((e.clientX - rect.left) / rect.width) * 100;
        setSplitPosition(Math.min(Math.max(position, 20), 80));
      }
    }
  };

  const getMatchScore = (cnisId: string, docId: string) => {
    const cnis = vinculosCNIS.find(v => v.id === cnisId);
    const doc = vinculosDocumento.find(v => v.id === docId);
    
    if (!cnis || !doc) return 0;
    if (cnis.correspondencia === docId) return 95;
    if (cnis.empresa === doc.empresa) return 75;
    return 0;
  };

  const renderVinculo = (vinculo: Vinculo, isSelected: boolean, onClick: () => void) => {
    const hasMatch = vinculo.correspondencia;
    const score = hasMatch ? vinculo.score || 0 : 0;

    return (
      <div
        key={vinculo.id}
        onClick={onClick}
        className={`
          p-4 rounded-lg border cursor-pointer transition-all
          ${isSelected 
            ? 'border-primary bg-primary/5 shadow-md' 
            : 'border-border hover:border-primary/50 hover-elevate'
          }
        `}
        data-testid={`vinculo-${vinculo.id}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-sm flex-1">{vinculo.empresa}</h4>
          {hasMatch && (
            <Badge 
              variant="outline" 
              className={
                score >= 90 
                  ? 'bg-success/10 text-success border-success/20'
                  : score >= 70
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : 'bg-muted text-muted-foreground'
              }
            >
              {score}% match
            </Badge>
          )}
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium tabular-nums">{vinculo.inicio}</span>
            <span>→</span>
            <span className="font-medium tabular-nums">{vinculo.fim || 'Atual'}</span>
          </div>
          
          {vinculo.remuneracao && (
            <p className="text-xs text-muted-foreground">
              Remuneração: {vinculo.remuneracao}
            </p>
          )}
          
          {vinculo.divergencias && vinculo.divergencias.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-warning mt-2">
              <AlertCircle className="h-3 w-3" />
              <span>{vinculo.divergencias.length} divergência(s)</span>
            </div>
          )}
        </div>

        {hasMatch && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-success/10 text-success border-success/20"
              onClick={(e) => {
                e.stopPropagation();
                onAceitarVinculo?.(vinculo.id, vinculo.correspondencia!);
              }}
              data-testid={`button-aceitar-${vinculo.id}`}
            >
              <Check className="h-4 w-4 mr-1" />
              Aceitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onRejeitarVinculo?.(vinculo.id, vinculo.correspondencia!);
              }}
              data-testid={`button-rejeitar-${vinculo.id}`}
            >
              <X className="h-4 w-4 mr-1" />
              Rejeitar
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Comparação de Documentos</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">CNIS</Badge>
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">{documentoTipo}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[600px] flex">
          {/* Painel Esquerdo - CNIS */}
          <div 
            className="overflow-hidden bg-background"
            style={{ width: `${splitPosition}%` }}
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  CNIS - {vinculosCNIS.length} vínculos
                </h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {vinculosCNIS.map((vinculo) => 
                    renderVinculo(
                      vinculo,
                      selectedCNIS === vinculo.id,
                      () => setSelectedCNIS(vinculo.id)
                    )
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Divisor Arrastável */}
          <div
            className="relative w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors group"
            onMouseMove={handleDrag}
            data-testid="split-divider"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 bg-background border border-border rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Painel Direito - Documento */}
          <div 
            className="overflow-hidden bg-background"
            style={{ width: `${100 - splitPosition}%` }}
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  {documentoTipo} - {vinculosDocumento.length} vínculos
                </h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {vinculosDocumento.map((vinculo) => 
                    renderVinculo(
                      vinculo,
                      selectedDoc === vinculo.id,
                      () => setSelectedDoc(vinculo.id)
                    )
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Rodapé com ações */}
        <div className="border-t border-border bg-muted/30 p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedCNIS && selectedDoc ? (
              <>
                Match score: <strong className="text-foreground">
                  {getMatchScore(selectedCNIS, selectedDoc)}%
                </strong>
              </>
            ) : (
              'Selecione vínculos em ambos os lados para comparar'
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" data-testid="button-criar-vinculo">
              Criar Vínculo Manual
            </Button>
            <Button size="sm" data-testid="button-salvar-comparacao">
              Salvar Correspondências
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
