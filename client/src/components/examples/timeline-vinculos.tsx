import { TimelineVinculos } from "../timeline-vinculos";

const mockVinculos = [
  {
    id: "1",
    empresa: "ABC Indústria Ltda",
    inicio: new Date(2015, 0, 1),
    fim: new Date(2020, 11, 31),
    tipo: "comum" as const,
    remuneracao: "R$ 3.200,00",
  },
  {
    id: "2",
    empresa: "Mineradora XYZ S.A.",
    inicio: new Date(2012, 5, 1),
    fim: new Date(2014, 11, 31),
    tipo: "especial" as const,
    remuneracao: "R$ 2.800,00",
  },
  {
    id: "3",
    empresa: "Comércio 123 Ltda",
    inicio: new Date(2021, 0, 1),
    fim: null,
    tipo: "comum" as const,
    remuneracao: "R$ 4.500,00",
  },
  {
    id: "4",
    empresa: "Construtora DEF",
    inicio: new Date(2010, 2, 1),
    fim: new Date(2012, 4, 31),
    tipo: "especial" as const,
    remuneracao: "R$ 2.400,00",
  },
  {
    id: "5",
    empresa: "Serviços GHI",
    inicio: new Date(2017, 6, 1),
    fim: new Date(2019, 8, 30),
    tipo: "comum" as const,
    remuneracao: "R$ 3.800,00",
  },
];

export default function TimelineVinculosExample() {
  return (
    <div className="p-8 bg-background">
      <TimelineVinculos
        vinculos={mockVinculos}
        onVinculoClick={(id) => console.log('Vínculo clicado:', id)}
      />
    </div>
  );
}
