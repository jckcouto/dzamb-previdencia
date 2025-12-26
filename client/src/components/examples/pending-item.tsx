import { PendingItem } from "../pending-item";

export default function PendingItemExample() {
  return (
    <div className="space-y-4 p-8 bg-background max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Pendências</h2>
      <PendingItem
        id="1"
        type="inss_error"
        priority="high"
        title="Vínculo sem data de término"
        description="Empresa ABC Ltda - Período iniciado em 01/2018 sem data de encerramento registrada no CNIS"
        requiredAction="Solicitar ao cliente a CTPS ou carta de dispensa para comprovação do término do vínculo"
      />
      <PendingItem
        id="2"
        type="missing_doc"
        priority="medium"
        title="Falta extrato do FGTS"
        description="Período de 2015 a 2017 sem comprovação de remuneração"
        requiredAction="Solicitar extrato analítico do FGTS do período indicado"
      />
      <PendingItem
        id="3"
        type="divergence"
        priority="low"
        title="Divergência de remuneração"
        description="Valor informado na CTPS difere do registrado no CNIS para o período 06/2019"
      />
      <PendingItem
        id="4"
        type="resolved"
        priority="low"
        title="Documento anexado com sucesso"
        description="PPP do período especial foi validado e integrado"
      />
    </div>
  );
}
