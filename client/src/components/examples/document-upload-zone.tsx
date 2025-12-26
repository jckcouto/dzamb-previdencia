import { DocumentUploadZone } from "../document-upload-zone";

export default function DocumentUploadZoneExample() {
  return (
    <div className="p-8 bg-background max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Upload de Documentos</h2>
      <DocumentUploadZone
        onFilesSelected={(files) => console.log('Files:', files)}
      />
    </div>
  );
}
