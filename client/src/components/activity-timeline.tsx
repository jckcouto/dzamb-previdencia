import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MessageSquare,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Edit,
  Tag as TagIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Activity {
  id: string;
  tipo: "document" | "comment" | "assignment" | "status" | "edit" | "tag";
  usuario: string;
  usuarioAvatar?: string;
  descricao: string;
  timestamp: Date;
  metadata?: {
    statusAnterior?: string;
    statusNovo?: string;
    documentoNome?: string;
    tagsAdicionadas?: string[];
    tagsRemovidas?: string[];
  };
}

interface ActivityTimelineProps {
  activities: Activity[];
  className?: string;
}

const activityIcons = {
  document: Upload,
  comment: MessageSquare,
  assignment: UserPlus,
  status: Clock,
  edit: Edit,
  tag: TagIcon,
};

const activityColors = {
  document: "text-blue-500",
  comment: "text-green-500",
  assignment: "text-purple-500",
  status: "text-orange-500",
  edit: "text-yellow-500",
  tag: "text-pink-500",
};

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  const getInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Agora mesmo";
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.tipo];
        const iconColor = activityColors[activity.tipo];

        return (
          <div
            key={activity.id}
            className="relative flex gap-3"
            data-testid={`activity-${activity.id}`}
          >
            {index < activities.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
            )}

            <Avatar className="h-10 w-10 shrink-0 border-2 border-background">
              <AvatarImage src={activity.usuarioAvatar} alt={activity.usuario} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(activity.usuario)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{activity.usuario}</p>
                  <div className={cn("flex items-center gap-1", iconColor)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">{activity.descricao}</p>

              {activity.metadata && (
                <div className="pt-2">
                  {activity.metadata.statusAnterior && activity.metadata.statusNovo && (
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="font-normal">
                        {activity.metadata.statusAnterior}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="default" className="font-normal">
                        {activity.metadata.statusNovo}
                      </Badge>
                    </div>
                  )}

                  {activity.metadata.documentoNome && (
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {activity.metadata.documentoNome}
                      </span>
                    </div>
                  )}

                  {activity.metadata.tagsAdicionadas && activity.metadata.tagsAdicionadas.length > 0 && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground shrink-0">Adicionou:</span>
                      <div className="flex flex-wrap gap-1">
                        {activity.metadata.tagsAdicionadas.map((tag) => (
                          <Badge key={tag} variant="default" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {activity.metadata.tagsRemovidas && activity.metadata.tagsRemovidas.length > 0 && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground shrink-0">Removeu:</span>
                      <div className="flex flex-wrap gap-1">
                        {activity.metadata.tagsRemovidas.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {activities.length === 0 && (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade registrada ainda
          </p>
        </div>
      )}
    </div>
  );
}
