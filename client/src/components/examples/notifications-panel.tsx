import { NotificationsPanel } from "../notifications-panel";

const mockNotifications = [
  {
    id: "1",
    tipo: "pendencia" as const,
    titulo: "3 pendências urgentes identificadas",
    descricao: "Caso Maria Silva Santos - Documentos necessários para regularização",
    timestamp: new Date(Date.now() - 300000),
    lida: false,
    casoId: "1",
    casoNome: "Maria Silva",
  },
  {
    id: "2",
    tipo: "documento" as const,
    titulo: "Novo documento processado",
    descricao: "CTPS do cliente João Pedro Oliveira foi analisada com sucesso",
    timestamp: new Date(Date.now() - 3600000),
    lida: false,
    casoId: "2",
    casoNome: "João Pedro",
  },
  {
    id: "3",
    tipo: "prazo" as const,
    titulo: "Prazo se aproximando",
    descricao: "Prazo para resposta ao INSS termina em 5 dias",
    timestamp: new Date(Date.now() - 7200000),
    lida: false,
    casoId: "3",
    casoNome: "Ana Carolina",
  },
  {
    id: "4",
    tipo: "sucesso" as const,
    titulo: "Parecer gerado com sucesso",
    descricao: "Parecer técnico do caso Carlos Eduardo está pronto para download",
    timestamp: new Date(Date.now() - 86400000),
    lida: true,
    casoId: "4",
    casoNome: "Carlos Eduardo",
  },
  {
    id: "5",
    tipo: "pendencia" as const,
    titulo: "Divergência encontrada",
    descricao: "Divergência de remuneração entre CNIS e CTPS no período 06/2019",
    timestamp: new Date(Date.now() - 172800000),
    lida: true,
    casoId: "1",
    casoNome: "Maria Silva",
  },
];

export default function NotificationsPanelExample() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-8">
      <NotificationsPanel
        notifications={mockNotifications}
        onMarkAsRead={(id) => console.log('Mark as read:', id)}
        onMarkAllAsRead={() => console.log('Mark all as read')}
        onDelete={(id) => console.log('Delete:', id)}
        onNotificationClick={(n) => console.log('Clicked:', n)}
      />
    </div>
  );
}
