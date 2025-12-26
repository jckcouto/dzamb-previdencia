import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Check, X } from "lucide-react";

interface DocumentViewerProps {
  title: string;
  documents: {
    id: string;
    name: string;
    type: string;
    status: 'success' | 'warning' | 'error';
    issues?: number;
  }[];
  onDocumentSelect?: (docId: string) => void;
}

export function DocumentViewer({ title, documents, onDocumentSelect }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const statusConfig = {
    success: { icon: Check, className: 'text-success', bgClassName: 'bg-success/10' },
    warning: { icon: Eye, className: 'text-warning', bgClassName: 'bg-warning/10' },
    error: { icon: X, className: 'text-destructive', bgClassName: 'bg-destructive/10' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.map((doc) => {
          const StatusIcon = statusConfig[doc.status].icon;
          const isSelected = selectedDoc === doc.id;

          return (
            <div
              key={doc.id}
              onClick={() => {
                setSelectedDoc(doc.id);
                onDocumentSelect?.(doc.id);
                console.log('Document selected:', doc.id);
              }}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                ${isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover-elevate'
                }
              `}
              data-testid={`doc-item-${doc.id}`}
            >
              <div className={`rounded-lg p-2 ${statusConfig[doc.status].bgClassName}`}>
                <FileText className={`h-5 w-5 ${statusConfig[doc.status].className}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.type}</p>
              </div>
              <div className="flex items-center gap-2">
                {doc.issues && doc.issues > 0 && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    {doc.issues} issue{doc.issues > 1 ? 's' : ''}
                  </Badge>
                )}
                <StatusIcon className={`h-5 w-5 ${statusConfig[doc.status].className}`} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Download:', doc.id);
                  }}
                  data-testid={`button-download-${doc.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
