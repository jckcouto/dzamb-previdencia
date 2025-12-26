import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const newCaseSchema = z.object({
  clienteNome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  clienteEmail: z.string().email("Email inválido"),
  clienteCPF: z.string().min(11, "CPF inválido"),
  clienteTelefone: z.string().optional(),
  titulo: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  descricao: z.string().optional(),
  tipoBeneficio: z.string().min(1, "Selecione o tipo de benefício"),
  prioridade: z.string().min(1, "Selecione a prioridade"),
  prazoEstimado: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type NewCaseForm = z.infer<typeof newCaseSchema>;

const tiposBeneficio = [
  "Aposentadoria por Idade",
  "Aposentadoria por Tempo de Contribuição",
  "Aposentadoria Especial",
  "Aposentadoria por Invalidez",
  "Aposentadoria da Pessoa com Deficiência",
  "Pensão por Morte",
  "Auxílio-Doença",
  "Salário-Maternidade",
  "BPC/LOAS",
  "Revisão de Benefício",
  "Outro",
];

const prioridades = [
  { value: "baixa", label: "Baixa" },
  { value: "média", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const tagsDisponiveis = [
  "CNIS Pendente",
  "Documentação Incompleta",
  "Prazo Apertado",
  "Revisão",
  "Recurso",
  "Primeira Análise",
  "Segurado Especial",
  "Rural",
];

interface NewCaseDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function NewCaseDialog({ trigger, onSuccess }: NewCaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<NewCaseForm>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      clienteNome: "",
      clienteEmail: "",
      clienteCPF: "",
      clienteTelefone: "",
      titulo: "",
      descricao: "",
      tipoBeneficio: "",
      prioridade: "média",
      prazoEstimado: "",
      tags: [],
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: async (formData: NewCaseForm) => {
      const clientRes = await apiRequest("POST", "/api/clients", {
        nome: formData.clienteNome,
        email: formData.clienteEmail,
        cpf: formData.clienteCPF,
        telefone: formData.clienteTelefone || null,
      });
      const client = await clientRes.json();

      const caseRes = await apiRequest("POST", "/api/cases", {
        clienteId: client.id,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        tipoBeneficio: formData.tipoBeneficio,
        prioridade: formData.prioridade,
        prazoEstimado: formData.prazoEstimado || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
      });
      const caseData = await caseRes.json();

      return caseData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      
      toast({
        title: "Caso criado com sucesso!",
        description: `O caso "${data.titulo}" foi criado.`,
      });

      form.reset();
      setSelectedTags([]);
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar caso",
        description: error.message || "Ocorreu um erro ao criar o caso. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      form.setValue("tags", newTags);
    }
  };

  const removeTag = (tag: string) => {
    const newTags = selectedTags.filter((t) => t !== tag);
    setSelectedTags(newTags);
    form.setValue("tags", newTags);
  };

  const onSubmit = async (data: NewCaseForm) => {
    createCaseMutation.mutate(data);
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (confirm("Descartar alterações? Os dados preenchidos serão perdidos.")) {
        form.reset();
        setSelectedTags([]);
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-new-case" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Caso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Criar Novo Caso</DialogTitle>
          <DialogDescription>
            Preencha as informações do cliente e do caso previdenciário
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Dados do Cliente</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clienteNome"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Maria Silva Santos"
                          data-testid="input-client-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clienteCPF"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          data-testid="input-client-cpf"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clienteTelefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 98765-4321"
                          data-testid="input-client-phone"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clienteEmail"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="cliente@email.com"
                          data-testid="input-client-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">Informações do Caso</h3>

              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Caso *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Aposentadoria por Tempo de Contribuição - Maria Silva"
                        data-testid="input-case-title"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Identificação rápida do caso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os detalhes e objetivos do caso..."
                        className="min-h-[100px] resize-none"
                        data-testid="input-case-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoBeneficio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Benefício *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-benefit-type">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposBeneficio.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {prioridades.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="prazoEstimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo Estimado</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 30 dias, 2 meses, 15/12/2025"
                        data-testid="input-deadline"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Prazo esperado para conclusão
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags/Etiquetas</FormLabel>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {tagsDisponiveis.map((tag) => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer hover-elevate active-elevate-2"
                            onClick={() =>
                              selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)
                            }
                            data-testid={`tag-option-${tag}`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <span className="text-xs text-muted-foreground">Selecionadas:</span>
                          {selectedTags.map((tag) => (
                            <Badge
                              key={tag}
                              className="gap-1"
                              data-testid={`tag-selected-${tag}`}
                            >
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      Clique nas tags para adicionar ao caso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel"
                disabled={createCaseMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                data-testid="button-submit"
                disabled={createCaseMutation.isPending}
              >
                {createCaseMutation.isPending ? "Criando..." : "Criar Caso"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
