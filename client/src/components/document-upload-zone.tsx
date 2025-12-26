import { useCallback, useState } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

interface DocumentUploadZoneProps {
  onFilesSelected?: (files: File[]) => void;
  acceptedTypes?: string;
  maxFiles?: number;
}

export function DocumentUploadZone({ 
  onFilesSelected, 
  acceptedTypes = ".pdf,.html,.xml,image/*",
  maxFiles = 10 
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = (files: File[]) => {
    console.log('Files selected:', files);
    onFilesSelected?.(files);
    
    const newFiles: UploadedFile[] = files.slice(0, maxFiles).map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      simulateUpload(file.id);
    });
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress, status: progress === 100 ? 'completed' : 'uploading' }
            : f
        )
      );
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border-2 border-dashed p-12 text-center transition-all duration-200
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02] shadow-md' 
            : 'border-border hover:border-primary/50'
          }
        `}
        data-testid="dropzone-upload"
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={acceptedTypes}
          multiple
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-base font-medium mb-2">
            Arraste documentos aqui ou clique para selecionar
          </p>
          <p className="text-sm text-muted-foreground">
            CNIS, CTPS, FGTS, PPP, Guias, Contratos (PDF, HTML, XML, Imagens)
          </p>
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Arquivos ({uploadedFiles.length})</h3>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-200 hover-elevate"
            >
              <File className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="h-1 mt-2" />
                )}
                {file.status === 'completed' && (
                  <p className="text-xs text-success mt-1">✓ Concluído</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(file.id)}
                data-testid={`button-remove-${file.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
