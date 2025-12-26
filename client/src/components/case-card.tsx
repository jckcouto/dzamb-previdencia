import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, AlertCircle, FileText, MoreVertical } from "lucide-react";
import { Link } from "wouter";

interface CaseCardProps {
  id: string;
  clientName: string;
  status: 'analyzing' | 'pending' | 'completed' | 'draft';
  contributionTime?: string;
  pendingCount: number;
  lastUpdate: string;
  documentsCount: number;
  prioridade?: 'alta' | 'média' | 'baixa';
  tipoBeneficio?: string;
  dataAtualizacao?: Date;
}

const statusConfig = {
  analyzing: { label: 'Em Análise', className: 'bg-info/10 text-info border-info/20' },
  pending: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' },
  completed: { label: 'Concluído', className: 'bg-success/10 text-success border-success/20' },
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground border-muted' },
};

const prioridadeConfig = {
  alta: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  média: { label: 'Média', className: 'bg-warning/10 text-warning border-warning/20' },
  baixa: { label: 'Baixa', className: 'bg-muted text-muted-foreground border-muted' },
};

export function CaseCard({ 
  id, 
  clientName, 
  status, 
  contributionTime, 
  pendingCount, 
  lastUpdate,
  documentsCount,
  prioridade,
  tipoBeneficio,
  dataAtualizacao
}: CaseCardProps) {
  const statusInfo = statusConfig[status];
  const prioridadeInfo = prioridade ? prioridadeConfig[prioridade] : null;
  const initials = clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`card-case-${id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{clientName}</h3>
            {contributionTime && (
              <p className="text-sm text-muted-foreground">{contributionTime}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0" data-testid={`button-menu-${id}`}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={statusInfo.className} data-testid={`badge-status-${id}`}>
            {statusInfo.label}
          </Badge>
          {prioridadeInfo && (
            <Badge variant="outline" className={prioridadeInfo.className} data-testid={`badge-prioridade-${id}`}>
              {prioridadeInfo.label}
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              <AlertCircle className="h-3 w-3 mr-1" />
              {pendingCount} pendência{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{documentsCount} doc{documentsCount > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{lastUpdate}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t border-card-border">
        <Link href={`/casos/${id}`} className="w-full">
          <Button variant="outline" className="w-full" data-testid={`button-open-${id}`}>
            Abrir Caso
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
