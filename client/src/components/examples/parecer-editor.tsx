import { ParecerEditor } from "../parecer-editor";

export default function ParecerEditorExample() {
  return (
    <div className="h-screen bg-background p-8">
      <ParecerEditor
        clientName="Maria Silva Santos"
        caseName="001/2024"
        onSave={(content) => console.log('Salvar:', content)}
        onExport={() => console.log('Exportar PDF')}
      />
    </div>
  );
}
