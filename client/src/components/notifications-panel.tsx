import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Clock,
  Trash2,
  Check
} from "lucide-react";

interface Notification {
  id: string;
  tipo: 'pendencia' | 'documento' | 'prazo' | 'sucesso';
  titulo: string;
  descricao: string;
  timestamp: Date;
  lida: boolean;
  casoId?: string;
  casoNome?: string;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationsPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
}: NotificationsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || !n.lida
  );

  const unreadCount = notifications.filter(n => !n.lida).length;

  const getIcon = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'pendencia':
        return AlertCircle;
      case 'documento':
        return FileText;
      case 'prazo':
        return Clock;
      case 'sucesso':
        return CheckCircle;
      default:
        return Bell;
    }
  };

  const getIconColor = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'pendencia':
        return 'text-warning';
      case 'documento':
        return 'text-info';
      case 'prazo':
        return 'text-destructive';
      case 'sucesso':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              data-testid="button-mark-all-read"
            >
              <Check className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList className="w-full rounded-none border-b border-border">
            <TabsTrigger value="all" className="flex-1" data-testid="tab-all">
              Todas
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1" data-testid="tab-unread">
              Não lidas ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="m-0">
            <ScrollArea className="h-[500px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Bell className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => {
                    const Icon = getIcon(notification.tipo);
                    const iconColor = getIconColor(notification.tipo);

                    return (
                      <div
                        key={notification.id}
                        className={`
                          p-4 transition-all cursor-pointer hover-elevate
                          ${!notification.lida ? 'bg-primary/5' : ''}
                        `}
                        onClick={() => {
                          onNotificationClick?.(notification);
                          if (!notification.lida) {
                            onMarkAsRead?.(notification.id);
                          }
                        }}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 ${iconColor}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium ${!notification.lida ? 'font-semibold' : ''}`}>
                                {notification.titulo}
                              </h4>
                              {!notification.lida && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.descricao}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimestamp(notification.timestamp)}</span>
                              </div>
                              
                              {notification.casoNome && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.casoNome}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete?.(notification.id);
                            }}
                            data-testid={`button-delete-${notification.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
