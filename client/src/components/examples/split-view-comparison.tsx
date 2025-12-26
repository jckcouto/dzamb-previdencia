import { SplitViewComparison } from "../split-view-comparison";

const mockVinculosCNIS = [
  {
    id: "c1",
    empresa: "ABC Indústria Ltda",
    inicio: "01/2015",
    fim: "12/2020",
    remuneracao: "R$ 3.200,00",
    fonte: "cnis" as const,
    correspondencia: "d1",
    score: 95,
  },
  {
    id: "c2",
    empresa: "XYZ Comércio S.A.",
    inicio: "01/2021",
    fim: "",
    remuneracao: "R$ 4.500,00",
    fonte: "cnis" as const,
    divergencias: ["Data de término não informada"],
  },
  {
    id: "c3",
    empresa: "123 Serviços Ltda",
    inicio: "06/2012",
    fim: "12/2014",
    remuneracao: "",
    fonte: "cnis" as const,
    correspondencia: "d2",
    score: 88,
    divergencias: ["Remuneração não informada"],
  },
];

const mockVinculosCTPS = [
  {
    id: "d1",
    empresa: "ABC Indústria Ltda",
    inicio: "15/01/2015",
    fim: "30/12/2020",
    remuneracao: "R$ 3.200,00",
    fonte: "ctps" as const,
  },
  {
    id: "d2",
    empresa: "123 Serviços",
    inicio: "10/06/2012",
    fim: "20/12/2014",
    remuneracao: "R$ 2.800,00",
    fonte: "ctps" as const,
  },
  {
    id: "d3",
    empresa: "Empresa DEF",
    inicio: "01/03/2010",
    fim: "30/05/2012",
    remuneracao: "R$ 2.400,00",
    fonte: "ctps" as const,
  },
];

export default function SplitViewComparisonExample() {
  return (
    <div className="p-8 bg-background">
      <SplitViewComparison
        vinculosCNIS={mockVinculosCNIS}
        vinculosDocumento={mockVinculosCTPS}
        documentoTipo="CTPS"
        onAceitarVinculo={(cnisId, docId) => console.log('Aceitar:', cnisId, docId)}
        onRejeitarVinculo={(cnisId, docId) => console.log('Rejeitar:', cnisId, docId)}
      />
    </div>
  );
}
