import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X, Tag } from "lucide-react";

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: string[];
}

const defaultAvailableTags = [
  "CNIS Pendente",
  "Documentação Incompleta",
  "Prazo Apertado",
  "Revisão",
  "Recurso",
  "Primeira Análise",
  "Segurado Especial",
  "Rural",
  "Urbano",
  "Autônomo",
  "CLT",
  "Servidor Público",
  "Aposentadoria Especial",
  "Tempo de Contribuição",
  "Idade",
  "Invalidez",
  "Aguardando Cliente",
  "Em Análise Técnica",
  "Pronto para Parecer",
];

export function TagManager({ tags, onTagsChange, availableTags = defaultAvailableTags }: TagManagerProps) {
  const [newTag, setNewTag] = useState("");
  const [open, setOpen] = useState(false);

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (newTag.trim()) {
        addTag(newTag.trim());
      }
    }
  };

  const unusedTags = availableTags.filter((tag) => !tags.includes(tag));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="default"
            className="gap-1 pr-1"
            data-testid={`tag-${tag}`}
          >
            {tag}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeTag(tag)}
              className="h-4 w-4 ml-1 rounded-sm p-0.5"
              data-testid={`button-remove-tag-${tag}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1"
              data-testid="button-add-tag"
            >
              <Plus className="h-3 w-3" />
              Adicionar Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Adicionar nova tag</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-8"
                    data-testid="input-new-tag"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newTag.trim()) {
                        addTag(newTag.trim());
                      }
                    }}
                    data-testid="button-submit-tag"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {unusedTags.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Tags sugeridas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {unusedTags.slice(0, 12).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => addTag(tag)}
                        data-testid={`suggested-tag-${tag}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
