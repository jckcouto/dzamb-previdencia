import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface RetirementRuleCardProps {
  id: string;
  ruleName: string;
  ruleDescription: string;
  requirementsMet: number;
  requirementsTotal: number;
  projectedDate?: string;
  monthsRemaining?: number;
  estimatedBenefit?: string;
  details?: {
    label: string;
    current: string;
    required: string;
  }[];
}

export function RetirementRuleCard({
  id,
  ruleName,
  ruleDescription,
  requirementsMet,
  requirementsTotal,
  projectedDate,
  monthsRemaining,
  estimatedBenefit,
  details,
}: RetirementRuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = (requirementsMet / requirementsTotal) * 100;
  const isMet = requirementsMet >= requirementsTotal;

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`rule-card-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{ruleName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{ruleDescription}</p>
          </div>
          {isMet && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 flex-shrink-0">
              Cumprida
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium tabular-nums">
              {requirementsMet} / {requirementsTotal} meses
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {projectedDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Data projetada:</span>
            <span className="font-medium">{projectedDate}</span>
            {monthsRemaining && monthsRemaining > 0 && (
              <Badge variant="outline" className="ml-auto">
                {monthsRemaining} meses restantes
              </Badge>
            )}
          </div>
        )}

        {estimatedBenefit && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-muted-foreground">RMI estimada:</span>
            <span className="font-semibold text-success">{estimatedBenefit}</span>
          </div>
        )}

        {details && details.length > 0 && (
          <div className="pt-2 border-t border-card-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-between"
              data-testid={`button-toggle-details-${id}`}
            >
              <span className="text-sm font-medium">
                {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {isExpanded && (
              <div className="mt-3 space-y-2">
                {details.map((detail, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{detail.label}</span>
                    <div className="text-right">
                      <span className="font-medium tabular-nums">{detail.current}</span>
                      <span className="text-muted-foreground"> / {detail.required}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
