# DZAMB Previdência Platform

## Overview

DZAMB Previdência é uma plataforma web focada em **planejamento previdenciário automatizado** para advogados brasileiros especializados em direito previdenciário. O sistema automatiza a análise de documentos (CNIS, CTPS, PPP, FGTS), cruza informações entre documentos, detecta inconsistências, gera listas de pendências e produz pareceres técnicos detalhados.

**Slogan**: "Do Zero ao Melhor Benefício"

### Funcionalidades Principais
- Upload e análise de documentos previdenciários (CNIS obrigatório)
- Extração estruturada de vínculos empregatícios via IA
- Cruzamento de documentos para detecção de inconsistências
- Geração automática de lista de pendências
- Editor de pareceres técnicos
- Dashboard com métricas de planejamentos

## User Preferences

Preferred communication style: Simple, everyday language (Portuguese BR).

## System Architecture

### Frontend
| Tecnologia | Propósito |
|------------|-----------|
| React 18 + TypeScript | Framework de UI |
| Vite | Build tool e dev server |
| Wouter | Roteamento SPA |
| TanStack Query v5 | Gerenciamento de estado e cache |
| Tailwind CSS | Framework CSS |
| shadcn/ui (New York) | Componentes UI |
| Radix UI | Primitivos acessíveis |
| Lucide React | Ícones |
| Framer Motion | Animações |
| Recharts | Gráficos |

#### Design System
- **Tema**: Dark-first premium com gold (#D4AF37) como cor primária
- **Fonte**: Inter
- **Cores**: DZAMB green, vibrant yellow tokens customizados

### Backend
| Tecnologia | Propósito |
|------------|-----------|
| Node.js 20 + Express.js | Runtime e framework web |
| TypeScript (ESM) | Tipagem estática |
| Drizzle ORM | Query builder type-safe |
| PostgreSQL (Neon) | Banco de dados serverless |
| Replit Object Storage | Armazenamento de PDFs |

### Autenticação
- **Método**: Sessão simples (sem autenticação externa)
- **Login**: Botão único "Entrar no Sistema" na tela de login
- **API**: POST /api/login define sessão, GET /api/me verifica autenticação
- **Nota**: Sistema simplificado sem verificação de credenciais - qualquer usuário pode entrar

## Project Structure

```
dzamb-previdencia/
├── client/                     # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Componentes shadcn/ui
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── stat-card.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── lib/
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── dashboard.tsx      # Página inicial
│   │   │   ├── planejamento.tsx   # Lista de planejamentos
│   │   │   ├── planejamento-novo.tsx
│   │   │   ├── planejamento-detalhes.tsx  # Fluxo 6 abas
│   │   │   ├── clientes.tsx
│   │   │   ├── admin.tsx
│   │   │   ├── login.tsx
│   │   │   └── ...
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── index.html
├── server/
│   ├── middleware/
│   │   └── auth.ts            # requireAuth, requireAdmin
│   ├── routes/
│   │   └── planejamento.ts    # Rotas de planejamento
│   ├── services/
│   │   ├── ai.ts              # analisarCNIS, cruzarDocumentos
│   │   ├── ai-providers.ts    # Multi-provider AI
│   │   └── fileUpload.ts      # Multer + Object Storage
│   ├── db.ts                  # Conexão Neon
│   ├── storage.ts             # Interface IStorage
│   ├── routes.ts              # Rotas principais
│   └── index.ts               # Entry point
├── shared/
│   └── schema.ts              # Drizzle schemas + Zod
├── design_guidelines.md
├── DOCUMENTACAO.md
└── replit.md
```

## Core Feature: Planejamento Previdenciário

### Fluxo de 6 Abas

O componente `planejamento-detalhes.tsx` implementa o fluxo principal:

1. **Documentos** - Upload de PDFs (CNIS, CTPS, PPP, FGTS)
2. **Vínculos** - Extração de vínculos do CNIS via IA (botão "Analisar CNIS")
3. **Inconsistências** - Detecção automática após cruzamento de documentos
4. **Pendências** - Lista de itens a resolver junto ao INSS
5. **Parecer** - Editor de texto para parecer técnico
6. **Resumo** - Visão consolidada do planejamento

### API Endpoints de Planejamento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/planejamento` | Lista planejamentos do usuário |
| GET | `/api/planejamento/:id` | Detalhes com documentos |
| POST | `/api/planejamento` | Criar novo planejamento |
| POST | `/api/planejamento/:id/upload` | Upload de documento PDF |
| POST | `/api/planejamento/:id/analisar-cnis` | Análise IA do CNIS |
| POST | `/api/planejamento/:id/cruzar-documento` | Cruzar doc e detectar inconsistências |
| GET | `/api/planejamento/:id/vinculos` | Listar vínculos extraídos |
| GET | `/api/planejamento/:id/competencias` | Buscar análise de competências (alias: analisar-competencias) |
| GET | `/api/planejamento/:id/inconsistencias` | Listar inconsistências |
| GET | `/api/planejamento/:id/pendencias` | Listar pendências |
| POST | `/api/planejamento/:id/parecer` | Salvar/gerar parecer |
| GET | `/api/planejamento/:id/resumo/pdf` | Exportar Resumo Executivo como PDF |

## Análise de Competências

A função `analisarCompetencias` detecta automaticamente meses faltantes nas remunerações:

- Calcula todos os meses esperados entre data_inicio e data_fim de cada vínculo
- Compara com as contribuições registradas no CNIS
- Classifica impacto:
  - **Baixo**: meses antes de 07/1994 (não afetam cálculo do benefício)
  - **Alto**: meses após 07/1994 (afetam cálculo do benefício)
- **Execução automática**: A análise é executada automaticamente após a extração do CNIS e salva na tabela `analise_competencias`
- **Persistência**: Os resultados são armazenados no banco de dados PostgreSQL para consulta posterior
- **Geração automática de pendências**: Quando impacto é "alto", cria pendência automaticamente:
  - Tipo: `remuneracoes_faltantes`
  - Prioridade: `alta`
  - Título: "Remunerações faltantes no vínculo [empregador]"
  - Descrição: mensagem explicativa da análise
- **Exibição visual na aba Vínculos**:
  - Badge amarelo: impacto "baixo" (antes de 07/1994)
  - Badge vermelho: impacto "alto" (após 07/1994)
  - Tooltip com mensagem explicativa ao passar o mouse

Retorno da análise:
```typescript
{
  vinculoId: string,
  vinculoSequencia: number,
  empregador: string,
  mesesEsperados: number,
  mesesRegistrados: number,
  mesesFaltantes: string[], // ex: ["08/1986", "09/1986"]
  impacto: "baixo" | "alto",
  mensagem: string
}
```

## Validação de Identificação (Fase 3)

O sistema valida automaticamente os dados de identificação extraídos do CNIS:

- **Extração automática**: Nome completo, CPF, nome da mãe, data de nascimento, e NITs
- **Validação cruzada**: Compara dados do CNIS com dados cadastrados do cliente
- **Tipos de alertas**:
  - **CPF divergente** (alta gravidade): CPF do CNIS difere do cadastrado
  - **Nome divergente** (alta gravidade): Nome do CNIS difere do cadastrado
  - **Nome da mãe ausente** (média gravidade): Recomenda-se solicitar atualização
  - **Múltiplos NITs** (média gravidade): Segurado possui mais de um NIT
- **Geração automática de pendências**: Alertas de alta gravidade geram pendências tipo `identificacao_divergente`

### API Endpoints de Identificação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/planejamento/:id/identificacao` | Dados de identificação do CNIS |
| GET | `/api/planejamento/:id/alertas-identificacao` | Alertas de validação |

### Tabelas de Identificação

```typescript
// Identificação extraída do CNIS
identificacaoCnis: id, planejamentoId, nomeCompleto, cpf, nomeMae, dataNascimento, nits[], validada

// Alertas de validação
alertasIdentificacao: id, planejamentoId, tipo, gravidade, mensagem
```

### Exibição no Frontend

- Card de "Identificação do Segurado" exibido na aba Vínculos
- Badge verde "Validado" quando sem alertas
- Badge vermelho "Atenção Necessária" para alertas de alta gravidade
- Badge amarelo "Verificar" para alertas de média gravidade
- Listagem detalhada de alertas com ícones e cores indicativas

## Database Schema (Drizzle)

### Principais Tabelas

```typescript
// Usuários com roles
users: id, username, email, role, avatar, ativo

// Planejamentos previdenciários
planejamentosCasos: id, userId, nomeCliente, cpfCliente, status, parecer

// Documentos uploadados
planejamentosDocumentos: id, planejamentoId, tipoDocumento, nomeArquivo, storageKey

// Vínculos extraídos do CNIS
vinculosCnis: id, planejamentoId, sequencia, empregador, tipoVinculo, 
              dataInicio, dataFim, ultimaRemuneracao, indicadores

// Inconsistências detectadas
inconsistencias: id, planejamentoId, tipo, gravidade, titulo, descricao,
                 documentoOrigem, documentoComparacao, sugestaoCorrecao

// Pendências a resolver
pendencias: id, planejamentoId, tipo, titulo, descricao, prioridade, status
```

## Environment Variables

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| DATABASE_URL | PostgreSQL connection string | Sim |
| SESSION_SECRET | Chave para sessões | Sim |
| DEFAULT_OBJECT_STORAGE_BUCKET_ID | Bucket para PDFs | Sim |
| OPENAI_API_KEY | API key OpenAI (GPT-4o Vision) | Para IA |
| ANTHROPIC_API_KEY | API key Anthropic (Claude) | Para IA |

## Development Commands

```bash
# Iniciar desenvolvimento
npm run dev

# Sincronizar schema com banco
npm run db:push

# Forçar sincronização
npm run db:push --force
```

## Key Implementation Notes

### Queries com Loading/Error States
```typescript
const { data, isLoading, isError, refetch } = useQuery<Type[]>({
  queryKey: ["/api/planejamento", id, "vinculos"],
  enabled: !!id,
});
```

### Mutations com Cache Invalidation
```typescript
const mutation = useMutation({
  mutationFn: async () => apiRequest("POST", endpoint, body),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/planejamento", id] });
  }
});
```

### Vínculo Expansion State
```typescript
const [vinculoExpandido, setVinculoExpandido] = useState<number | null>(null);
// Toggle com ID único do vínculo
onClick={() => setVinculoExpandido(vinculoExpandido === v.id ? null : v.id)}
```

## Documentation

- `DOCUMENTACAO.md` - Documentação completa em Português
- `design_guidelines.md` - Guia de design e identidade visual
