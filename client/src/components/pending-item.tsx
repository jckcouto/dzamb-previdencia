import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileQuestion, AlertTriangle, CheckCircle } from "lucide-react";

interface PendingItemProps {
  id: string;
  type: 'inss_error' | 'missing_doc' | 'divergence' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  requiredAction?: string;
  onResolve?: () => void;
  onIgnore?: () => void;
}

const typeConfig = {
  inss_error: {
    label: 'Erro INSS',
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  missing_doc: {
    label: 'Documento Faltante',
    icon: FileQuestion,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  divergence: {
    label: 'Divergência',
    icon: AlertTriangle,
    className: 'bg-info/10 text-info border-info/20',
  },
  resolved: {
    label: 'Resolvido',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
  },
};

const priorityConfig = {
  high: { label: 'Alta', className: 'bg-destructive text-destructive-foreground' },
  medium: { label: 'Média', className: 'bg-warning text-white' },
  low: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
};

export function PendingItem({
  id,
  type,
  priority,
  title,
  description,
  requiredAction,
  onResolve,
  onIgnore,
}: PendingItemProps) {
  const typeInfo = typeConfig[type];
  const priorityInfo = priorityConfig[priority];
  const TypeIcon = typeInfo.icon;

  return (
    <div 
      className="rounded-lg border border-border bg-card p-4 hover-elevate transition-all duration-200"
      data-testid={`pending-item-${id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${typeInfo.className.split(' ').slice(0, 2).join(' ')}`}>
          <TypeIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <Badge variant="outline" className={priorityInfo.className}>
              {priorityInfo.label}
            </Badge>
          </div>
          
          {requiredAction && (
            <div className="rounded-md bg-muted/50 p-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Ação Necessária:</p>
              <p className="text-sm">{requiredAction}</p>
            </div>
          )}

          {type !== 'resolved' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => {
                  console.log('Resolve pending:', id);
                  onResolve?.();
                }}
                data-testid={`button-resolve-${id}`}
              >
                Resolver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log('Ignore pending:', id);
                  onIgnore?.();
                }}
                data-testid={`button-ignore-${id}`}
              >
                Ignorar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
