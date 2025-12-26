import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  casoNome?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    tipo: "pendencia",
    titulo: "3 pendências urgentes",
    descricao: "Maria Silva Santos - Documentos necessários",
    timestamp: new Date(Date.now() - 300000),
    lida: false,
    casoNome: "Maria Silva",
  },
  {
    id: "2",
    tipo: "documento",
    titulo: "Novo documento processado",
    descricao: "CTPS do cliente João Pedro foi analisada",
    timestamp: new Date(Date.now() - 3600000),
    lida: false,
    casoNome: "João Pedro",
  },
  {
    id: "3",
    tipo: "prazo",
    titulo: "Prazo se aproximando",
    descricao: "Resposta ao INSS termina em 5 dias",
    timestamp: new Date(Date.now() - 7200000),
    lida: false,
    casoNome: "Ana Carolina",
  },
];

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.lida).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Notificações</h4>
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              data-testid="button-mark-all-read"
            >
              <Check className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.tipo);
                const iconColor = getIconColor(notification.tipo);

                return (
                  <div
                    key={notification.id}
                    className={`
                      p-4 transition-all cursor-pointer hover-elevate
                      ${!notification.lida ? 'bg-primary/5' : ''}
                    `}
                    onClick={() => handleMarkAsRead(notification.id)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className={`text-sm font-medium ${!notification.lida ? 'font-semibold' : ''}`}>
                            {notification.titulo}
                          </h5>
                          {!notification.lida && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.descricao}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
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
                          handleDelete(notification.id);
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
      </PopoverContent>
    </Popover>
  );
}
