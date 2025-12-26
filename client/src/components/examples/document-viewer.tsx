import { DocumentViewer } from "../document-viewer";

export default function DocumentViewerExample() {
  return (
    <div className="p-8 bg-background max-w-2xl mx-auto">
      <DocumentViewer
        title="Documentos Processados"
        documents={[
          { id: "1", name: "CNIS_Maria_Silva.pdf", type: "CNIS", status: "success" },
          { id: "2", name: "CTPS_Maria_Silva.pdf", type: "CTPS", status: "warning", issues: 2 },
          { id: "3", name: "Extrato_FGTS.pdf", type: "FGTS", status: "success" },
          { id: "4", name: "PPP_Empresa_ABC.pdf", type: "PPP", status: "error", issues: 1 },
          { id: "5", name: "Guias_Pagas_2020.pdf", type: "Guias", status: "success" },
        ]}
      />
    </div>
  );
}
