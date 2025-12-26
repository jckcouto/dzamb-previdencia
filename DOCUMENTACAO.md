# DZAMB PREVIDÊNCIA - DOCUMENTAÇÃO COMPLETA (v1 - 12/12/2024 01:53)

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Funcionalidades](#funcionalidades)
4. [Guia de Uso](#guia-de-uso)
5. [API Reference](#api-reference)
6. [Banco de Dados](#banco-de-dados)
7. [Integrações](#integrações)
8. [Segurança](#segurança)
9. [Deploy e Manutenção](#deploy-e-manutenção)

---

## Visão Geral

### O que é o DZAMB Previdência?

O **DZAMB Previdência** é uma plataforma web focada em **planejamento previdenciário automatizado** para advogados brasileiros especializados em direito previdenciário. O sistema automatiza a análise de documentos (CNIS, CTPS, FGTS, PPP), detecta inconsistências, cruza informações entre documentos, gera listas de pendências e produz pareceres técnicos detalhados.

**Slogan**: "Do Zero ao Melhor Benefício"

### Público-Alvo

- **Advogados Previdenciários**: Profissionais que trabalham com casos de aposentadoria e benefícios do INSS
- **Escritórios de Advocacia**: Equipes que precisam gerenciar múltiplos casos simultaneamente

### Principais Benefícios

- Redução significativa no tempo de análise de documentos
- Extração automática de vínculos empregatícios do CNIS via IA
- Detecção de inconsistências entre documentos
- Geração automática de lista de pendências
- Pareceres técnicos estruturados
- Interface intuitiva em português brasileiro

---

## Arquitetura do Sistema

### Stack Tecnológica

#### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.x | Biblioteca de UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool e dev server |
| Tailwind CSS | 3.x | Framework CSS |
| shadcn/ui | New York | Componentes UI |
| TanStack Query | 5.x | Gerenciamento de estado e cache |
| Wouter | 3.x | Roteamento |
| Framer Motion | 11.x | Animações |
| Recharts | 2.x | Gráficos e visualizações |
| Lucide React | - | Ícones |

#### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Node.js | 20.x | Runtime JavaScript |
| Express.js | 4.x | Framework web |
| TypeScript | 5.x | Tipagem estática |
| Drizzle ORM | 0.x | ORM e query builder |
| PostgreSQL | 15.x | Banco de dados (Neon) |
| Replit Object Storage | - | Armazenamento de PDFs |

#### Integrações de IA
| Provedor | Modelo | Uso |
|----------|--------|-----|
| OpenAI | GPT-4o | Análise de PDFs (Vision API) |
| Anthropic | Claude | Geração de pareceres |

### Estrutura de Diretórios

```
dzamb-previdencia/
├── client/                     # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Componentes shadcn/ui (50+ componentes)
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── stat-card.tsx
│   │   │   ├── timeline-vinculos.tsx
│   │   │   ├── parecer-editor.tsx
│   │   │   ├── document-upload-zone.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── lib/
│   │   │   ├── queryClient.ts  # Config TanStack Query
│   │   │   └── utils.ts        # Utilitários (cn, etc)
│   │   ├── pages/
│   │   │   ├── dashboard.tsx              # Página inicial
│   │   │   ├── planejamento.tsx           # Lista de planejamentos
│   │   │   ├── planejamento-novo.tsx      # Criar planejamento
│   │   │   ├── planejamento-detalhes.tsx  # Fluxo 6 abas
│   │   │   ├── clientes.tsx               # Gestão de clientes
│   │   │   ├── admin.tsx                  # Painel administrativo
│   │   │   ├── login.tsx                  # Página de login
│   │   │   └── ...
│   │   ├── App.tsx             # Rotas e providers
│   │   ├── index.css           # Tema e estilos globais
│   │   └── main.tsx            # Entry point
│   └── index.html
├── server/
│   ├── middleware/
│   │   └── auth.ts             # requireAuth, requireAdmin
│   ├── routes/
│   │   └── planejamento.ts     # Rotas de planejamento
│   ├── services/
│   │   ├── ai.ts               # analisarCNIS, cruzarDocumentos
│   │   ├── ai-providers.ts     # Multi-provider AI config
│   │   └── fileUpload.ts       # Multer + Object Storage
│   ├── db.ts                   # Conexão Neon PostgreSQL
│   ├── storage.ts              # Interface IStorage
│   ├── routes.ts               # Rotas principais
│   ├── replitAuth.ts           # OIDC setup
│   ├── seed-users.ts           # Whitelist de usuários
│   └── index.ts                # Entry point do servidor
├── shared/
│   └── schema.ts               # Drizzle schemas + Zod types
├── design_guidelines.md        # Guia de design
├── DOCUMENTACAO.md             # Esta documentação
└── replit.md                   # Resumo técnico
```

---

## Funcionalidades

### 1. Dashboard

**Caminho**: `/`

O Dashboard apresenta uma visão geral dos planejamentos:

#### Métricas Exibidas
- **Planejamentos Ativos**: Quantidade de casos em análise
- **Documentos Processados**: Total de documentos analisados
- **Pendências Abertas**: Itens que necessitam ação

#### Componentes
- **Cards de Estatísticas**: Métricas principais
- **Planejamentos Recentes**: Lista dos últimos casos
- **Acesso Rápido**: Botões para ações frequentes

---

### 2. Gestão de Clientes

**Caminho**: `/clientes`

Módulo para cadastro e gerenciamento de clientes.

#### Funcionalidades
- Cadastro de novos clientes com dados pessoais
- Busca por nome, email ou CPF
- Visualização de histórico de planejamentos
- Edição e exclusão de registros

#### Campos do Cliente
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome Completo | Texto | Sim |
| Email | Email | Sim |
| CPF | Texto (11 dígitos) | Sim |
| Telefone | Texto | Não |
| Data de Nascimento | Data | Não |

---

### 3. Planejamento Previdenciário (Funcionalidade Principal)

**Caminho**: `/planejamento`

O coração do sistema - análise automatizada de documentos com Inteligência Artificial.

#### Fluxo de 6 Abas

O planejamento é organizado em 6 abas sequenciais:

##### Aba 1: Documentos
- Upload de PDFs (CNIS, CTPS, PPP, FGTS, Holerites, Contratos)
- CNIS é obrigatório para análise
- Visualização de documentos carregados
- Download de arquivos

##### Aba 2: Vínculos
- Botão "Analisar CNIS" para extração via IA
- Exibe lista de vínculos empregatícios extraídos
- Cards expansíveis com detalhes:
  - Sequência, Empregador, Tipo de vínculo
  - Datas de início e fim
  - Última remuneração
  - Indicadores (contribuições especiais, etc)
- Seção de cruzamento com outros documentos
- Seletor de tipo de documento para comparação

##### Aba 3: Inconsistências
- Lista de divergências encontradas entre documentos
- Classificação por gravidade (alta, média, baixa)
- Descrição detalhada do problema
- Sugestão de correção
- Documento de origem vs. documento de comparação

##### Aba 4: Pendências
- Lista de itens a resolver junto ao INSS
- Prioridade (alta, média, baixa)
- Status (pendente, em_andamento, resolvida)
- Tipo de pendência
- Descrição detalhada

##### Aba 5: Parecer
- Editor de texto para parecer técnico
- Geração automática com IA (opcional)
- Histórico de versões
- Exportação para PDF

##### Aba 6: Resumo
- Visão consolidada do planejamento
- Status geral do caso
- Contagem de vínculos, inconsistências e pendências
- Ações rápidas

#### Tipos de Documentos Suportados
| Documento | Formato | Propósito |
|-----------|---------|-----------|
| CNIS | PDF | Cadastro Nacional de Informações Sociais (obrigatório) |
| CTPS | PDF | Carteira de Trabalho |
| FGTS | PDF | Extrato do FGTS |
| PPP | PDF | Perfil Profissiográfico Previdenciário |
| Holerite | PDF | Contracheques/Holerites |
| Contrato | PDF | Contrato de Trabalho |

---

### 4. Painel Administrativo

**Caminho**: `/admin`

Área restrita para administradores do sistema.

#### Métricas Disponíveis
- Total de usuários cadastrados
- Usuários ativos
- Planejamentos no sistema

#### Gestão de Usuários
- Lista de todos os usuários
- Alteração de roles (admin/advogado)
- Ativação/desativação de contas

---

## Guia de Uso

### Primeiro Acesso

1. Acesse a plataforma pelo URL fornecido
2. Faça login com sua conta Replit (autenticação OIDC)
3. Seu acesso será autorizado se seu email estiver na whitelist
4. Explore o Dashboard para visão geral

### Criando um Novo Planejamento

1. Navegue até **Planejamento** no menu lateral
2. Clique em **Novo Planejamento**
3. Preencha os dados do cliente (nome e CPF)
4. Clique em **Criar**
5. Você será redirecionado para a tela de detalhes

### Analisando Documentos

1. Na aba **Documentos**, faça upload do CNIS (obrigatório)
2. Opcionalmente, adicione CTPS, PPP, FGTS ou outros
3. Vá para a aba **Vínculos**
4. Clique no botão **Analisar CNIS**
5. Aguarde a extração via IA (1-3 minutos)
6. Revise os vínculos extraídos

### Cruzando Documentos

1. Com os vínculos já extraídos, role até "Cruzamento com Outros Documentos"
2. Selecione o tipo de documento (CTPS, PPP, etc)
3. Faça upload do arquivo
4. O sistema detectará inconsistências automaticamente
5. Verifique a aba **Inconsistências** para ver os resultados

### Gerando Parecer

1. Após revisar vínculos, inconsistências e pendências
2. Vá para a aba **Parecer**
3. Use o editor de texto para criar o parecer
4. Opcionalmente, clique em "Gerar com IA" para sugestão automática
5. Edite conforme necessário
6. Salve o parecer

---

## API Reference

### Autenticação

Todas as rotas protegidas requerem autenticação via sessão (cookie de sessão).

```
Cookie: connect.sid=<session_id>
```

### Endpoints de Planejamento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/planejamento` | Lista planejamentos do usuário |
| GET | `/api/planejamento/:id` | Detalhes com documentos |
| POST | `/api/planejamento` | Criar novo planejamento |
| DELETE | `/api/planejamento/:id` | Excluir planejamento |
| POST | `/api/planejamento/:id/upload` | Upload de documento PDF |
| POST | `/api/planejamento/:id/analisar-cnis` | Análise IA do CNIS |
| POST | `/api/planejamento/:id/cruzar-documento` | Cruzar doc e detectar inconsistências |
| GET | `/api/planejamento/:id/vinculos` | Listar vínculos extraídos |
| GET | `/api/planejamento/:id/inconsistencias` | Listar inconsistências |
| GET | `/api/planejamento/:id/pendencias` | Listar pendências |
| POST | `/api/planejamento/:id/parecer` | Salvar/gerar parecer |

#### Exemplos

**Criar Planejamento:**
```json
POST /api/planejamento
Content-Type: application/json

{
  "nomeCliente": "João da Silva",
  "cpfCliente": "12345678901"
}
```

**Upload de Documento:**
```
POST /api/planejamento/:id/upload
Content-Type: multipart/form-data

file: <arquivo.pdf>
tipoDocumento: CNIS
```

**Analisar CNIS:**
```json
POST /api/planejamento/:id/analisar-cnis
// Retorna vínculos extraídos
```

### Endpoints de Clientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/clients` | Lista todos os clientes |
| GET | `/api/clients/:id` | Busca cliente por ID |
| POST | `/api/clients` | Cria novo cliente |
| PATCH | `/api/clients/:id` | Atualiza cliente |
| DELETE | `/api/clients/:id` | Remove cliente |

### Endpoints de Usuários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/me` | Dados do usuário logado |
| GET | `/api/users` | Lista usuários (admin) |

---

## Banco de Dados

### Tecnologia

- **Provedor**: Neon (PostgreSQL Serverless)
- **ORM**: Drizzle ORM
- **Conexão**: WebSocket (@neondatabase/serverless)

### Tabelas Principais

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'advogado',  -- admin, advogado
  avatar TEXT,
  ativo BOOLEAN DEFAULT true
);
```

#### planejamentos_casos
```sql
CREATE TABLE planejamentos_casos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  nome_cliente TEXT NOT NULL,
  cpf_cliente TEXT NOT NULL,
  status TEXT DEFAULT 'rascunho',
  parecer TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### planejamentos_documentos
```sql
CREATE TABLE planejamentos_documentos (
  id SERIAL PRIMARY KEY,
  planejamento_id INTEGER REFERENCES planejamentos_casos(id),
  tipo_documento TEXT NOT NULL,  -- CNIS, CTPS, PPP, FGTS, etc
  nome_arquivo TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### vinculos_cnis
```sql
CREATE TABLE vinculos_cnis (
  id SERIAL PRIMARY KEY,
  planejamento_id INTEGER REFERENCES planejamentos_casos(id),
  sequencia INTEGER,
  empregador TEXT,
  tipo_vinculo TEXT,
  data_inicio TEXT,
  data_fim TEXT,
  ultima_remuneracao TEXT,
  indicadores TEXT[]
);
```

#### inconsistencias
```sql
CREATE TABLE inconsistencias (
  id SERIAL PRIMARY KEY,
  planejamento_id INTEGER REFERENCES planejamentos_casos(id),
  tipo TEXT NOT NULL,
  gravidade TEXT NOT NULL,  -- alta, media, baixa
  titulo TEXT NOT NULL,
  descricao TEXT,
  documento_origem TEXT,
  documento_comparacao TEXT,
  sugestao_correcao TEXT
);
```

#### pendencias
```sql
CREATE TABLE pendencias (
  id SERIAL PRIMARY KEY,
  planejamento_id INTEGER REFERENCES planejamentos_casos(id),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT NOT NULL,  -- alta, media, baixa
  status TEXT DEFAULT 'pendente'  -- pendente, em_andamento, resolvida
);
```

### Migrações

Para sincronizar o schema com o banco:

```bash
npm run db:push
```

Para forçar sincronização (cuidado em produção):

```bash
npm run db:push --force
```

---

## Integrações

### OpenAI (GPT-4o Vision)

Usado para análise de documentos PDF.

**Configuração:**
```env
OPENAI_API_KEY=sk-...
```

**Uso:**
- Extração de vínculos do CNIS
- Leitura de CTPS digitalizada
- Análise de PPP e outros documentos

### Anthropic (Claude)

Usado para geração de pareceres técnicos jurídicos.

**Configuração:**
```env
ANTHROPIC_API_KEY=sk-ant-...
```

**Uso:**
- Geração de pareceres
- Análise de texto jurídico
- Sugestões de correção

### Replit Auth (OIDC)

Autenticação via OpenID Connect do Replit.

**Configuração:**
```env
SESSION_SECRET=...
```

### Replit Object Storage

Armazenamento de documentos PDF.

**Configuração:**
```env
DEFAULT_OBJECT_STORAGE_BUCKET_ID=...
```

---

## Segurança

### Autenticação

- **Método**: Session-based com cookies HttpOnly
- **Provider**: Replit OIDC
- **Sessões**: Armazenadas em PostgreSQL (connect-pg-simple)

### Autorização

#### Roles (Papéis)
| Role | Descrição | Permissões |
|------|-----------|------------|
| admin | Administrador | Acesso total, gestão de usuários |
| advogado | Advogado | Planejamentos, clientes, documentos |

#### Middleware de Autenticação
```typescript
// Requer autenticação
app.get("/api/protected", requireAuth, handler);

// Requer role admin
app.get("/api/admin", requireAdmin, handler);
```

### Whitelist de Usuários

O sistema usa uma whitelist de emails autorizados definida em `server/seed-users.ts`. Apenas usuários com emails na lista podem acessar a plataforma.

### Proteção de Dados

- **Criptografia**: Cookies HttpOnly, secure
- **Tokens**: Tokens de API nunca são logados
- **Arquivos**: PDFs armazenados em Object Storage seguro

---

## Deploy e Manutenção

### Ambiente de Desenvolvimento

```bash
# Instalar dependências
npm install

# Sincronizar banco de dados
npm run db:push

# Iniciar servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:5000`.

### Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| DATABASE_URL | URL de conexão PostgreSQL | Sim |
| SESSION_SECRET | Chave para sessões | Sim |
| DEFAULT_OBJECT_STORAGE_BUCKET_ID | Bucket para PDFs | Sim |
| OPENAI_API_KEY | API key do OpenAI | Para IA |
| ANTHROPIC_API_KEY | API key do Anthropic | Para IA |

### Deploy no Replit

1. O projeto já está configurado para deploy automático
2. Clique em "Publish" na interface do Replit
3. Configure um domínio personalizado (opcional)
4. O sistema faz build e deploy automaticamente

### Monitoramento

- **Logs**: Disponíveis no console do Replit
- **Erros**: Rastreados em tempo real
- **Performance**: Métricas do Neon Dashboard

---

## Suporte

Para dúvidas ou problemas:
- Consulte esta documentação
- Verifique os logs do sistema
- Entre em contato com o administrador
