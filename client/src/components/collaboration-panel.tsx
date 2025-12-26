import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, UserPlus, Lock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  usuario: string;
  usuarioAvatar?: string;
  conteudo: string;
  timestamp: Date;
  isInternal: boolean;
}

interface CollaborationPanelProps {
  caseId: string;
  comments: Comment[];
  atribuidoA?: string;
  onCommentAdd?: (conteudo: string, isInternal: boolean) => void;
  onAssignmentChange?: (usuarioId: string) => void;
}

const mockUsuarios = [
  { id: "1", nome: "Dr. Carlos Silva", avatar: "" },
  { id: "2", nome: "Dra. Ana Oliveira", avatar: "" },
  { id: "3", nome: "Estagiário João", avatar: "" },
  { id: "4", nome: "Dra. Maria Santos", avatar: "" },
];

export function CollaborationPanel({
  caseId,
  comments,
  atribuidoA,
  onCommentAdd,
  onAssignmentChange,
}: CollaborationPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const { toast } = useToast();

  const getInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Agora mesmo";
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    onCommentAdd?.(newComment, isInternalComment);
    
    toast({
      title: "Comentário adicionado",
      description: isInternalComment
        ? "Comentário interno salvo com sucesso"
        : "Comentário público adicionado",
    });

    setNewComment("");
    setIsInternalComment(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            Atribuição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={atribuidoA} onValueChange={onAssignmentChange}>
            <SelectTrigger data-testid="select-assignee">
              <SelectValue placeholder="Selecionar responsável" />
            </SelectTrigger>
            <SelectContent>
              {mockUsuarios.map((usuario) => (
                <SelectItem key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Comentários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Adicionar comentário... (Ctrl+Enter para enviar)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] resize-none"
              data-testid="textarea-comment"
            />

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="internal-comment"
                  checked={isInternalComment}
                  onCheckedChange={setIsInternalComment}
                  data-testid="switch-internal-comment"
                />
                <Label htmlFor="internal-comment" className="text-sm cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    {isInternalComment ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Comentário interno</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-3.5 w-3.5" />
                        <span>Comentário público</span>
                      </>
                    )}
                  </div>
                </Label>
              </div>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="gap-2"
                data-testid="button-submit-comment"
              >
                <Send className="h-3.5 w-3.5" />
                Enviar
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t max-h-[400px] overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-md bg-muted/30"
                data-testid={`comment-${comment.id}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.usuarioAvatar} alt={comment.usuario} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(comment.usuario)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{comment.usuario}</p>
                      {comment.isInternal && (
                        <Badge variant="outline" className="h-5 gap-1">
                          <Lock className="h-3 w-3" />
                          <span className="text-xs">Interno</span>
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.conteudo}
                  </p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhum comentário ainda
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Seja o primeiro a comentar!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
