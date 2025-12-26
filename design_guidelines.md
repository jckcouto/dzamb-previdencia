# Design Guidelines - DZAMB Previdência

## Identidade Visual

A plataforma DZAMB Previdência segue uma identidade visual **premium e sofisticada**, inspirada na marca do curso "Do Zero ao Melhor Benefício", com foco em confiabilidade, profissionalismo e elegância característica de escritórios de advocacia de alto padrão.

### Paleta de Cores

#### Cores Principais

- **Dourado/Ouro (#D4AF37)** - `hsl(45 60% 55%)`
  - Cor primária da marca DZAMB
  - Representa confiança, valor premium e excelência
  - Usada em: logotipo, CTAs principais, destaques importantes, ícones de destaque
  
- **Preto Absoluto (#000000)** - `hsl(0 0% 0%)`
  - Background principal no dark mode (modo padrão)
  - Representa sofisticação, seriedade profissional e premium
  - Cria contraste máximo com elementos dourados

- **Verde DZAMB (#10A37F)** - `hsl(160 78% 42%)`
  - Cor de sucesso, confirmação e crescimento
  - Representa resultados positivos e conquistas
  - Usada em: status positivos, checkmarks verdes, indicadores de progresso

- **Amarelo Vibrante (#FFB400)** - `hsl(42 100% 50%)`
  - Cor de destaque e chamadas de atenção
  - Usada em: badges de pendências, alertas importantes, faixas de destaque
  - Representa urgência de forma positiva e atrativa

#### Cores Secundárias

- **Branco/Off-White (#F5F5F0)** - Textos principais no dark mode
- **Cinza Médio (#888)** - Textos secundários, informações complementares
- **Verde Oliva Escuro (#1A1A16)** - Cards e superfícies elevadas no dark mode
- **Vermelho Destrutivo (#E03131)** - Erros, ações críticas

### Tipografia

**Fonte Principal:** Inter
- Sans-serif moderna e altamente legível
- Weights utilizados: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- Excelente performance em interfaces digitais
- Ótima legibilidade em tabelas e dados numéricos
- Carregada via Google Fonts CDN

#### Hierarquia Tipográfica

```
H1 (Títulos de Página): text-3xl (30px), font-bold, tracking-tight
H2 (Seções): text-xl (20px), font-semibold
H3 (Cards/Componentes): text-lg (18px), font-semibold
Body: text-base (16px), font-regular
Small: text-sm (14px), font-regular
Tiny: text-xs (12px), font-medium, uppercase (para labels)
```

#### Números e Dados

- **Sempre** usar `tabular-nums` para alinhamento correto de números
- Negrito para valores monetários e métricas importantes
- Formato brasileiro: R$ 1.234,56 (ponto para milhar, vírgula para decimal)

### Modo Escuro (Dark Mode) - PADRÃO

O dark mode é o **modo padrão** da aplicação DZAMB, refletindo a identidade premium da marca:

#### Backgrounds
- **Principal**: Preto absoluto `#000000`
- **Cards/Superfícies**: Verde oliva escuro `#0A0A08` - `hsl(40 15% 8%)`
- **Sidebar**: Ainda mais escura `hsl(40 20% 6%)`
- **Elementos elevados**: Tons sutis de verde oliva/marrom escuro

#### Textos
- **Primário**: Off-white com toque dourado `hsl(45 20% 92%)`
- **Secundário**: Cinza médio `hsl(45 10% 60%)`
- **Terciário**: Cinza escuro para informações menos importantes

#### Borders e Separadores
- **Sutis**: Usando tons de dourado escuro `hsl(45 10% 18%)`
- **Destaque**: Dourado quando necessário enfatizar

#### Elevação
- **Hover**: Overlay dourado transparente (`rgba(212,175,55, .06)`)
- **Active**: Overlay dourado mais intenso (`rgba(212,175,55, .12)`)
- **Sombras**: Pretas intensas para profundidade

### Modo Claro (Light Mode)

Quando ativado, mantém a sofisticação com tons suaves:

- **Background**: Off-white `hsl(0 0% 98%)`
- **Cards**: Branco puro `#FFFFFF`
- **Textos**: Preto/cinza escuro
- **Dourado**: Mantém a mesma intensidade e destaque

### Espaçamento e Layout

#### Sistema de Grid

- **Container máximo**: 1440px
- **Sidebar fixa**: 320px (20rem) expandida / 64px colapsada
- **Header height**: 64px
- **Padding padrão em páginas**: 24px (p-6)
- **Gaps entre cards**: 16px (gap-4) ou 24px (gap-6)

#### Espaçamentos Consistentes

- **Pequeno (8px)**: Entre elementos intimamente relacionados
- **Médio (16px)**: Entre grupos de elementos
- **Grande (24px)**: Entre seções distintas
- **Extra Grande (32px)**: Entre áreas principais da página

### Componentes

#### Sidebar

```tsx
<Sidebar>
  - Background: Mais escuro que o background principal
  - Logo: Dourado com ícone em círculo
  - Itens: Hover com elevação dourada sutil
  - Item ativo: Background dourado/10, texto dourado
  - Border: Linha dourada sutil à direita
  - Footer: Perfil do usuário com avatar bordado em dourado
</Sidebar>
```

#### Cards

- **Background**: `bg-card` (elevado do background)
- **Border**: `border-card-border` (sutil)
- **Border Radius**: 8px (rounded-lg)
- **Padding interno**: 16-24px (p-4 a p-6)
- **Hover**: Classe `hover-elevate` para elevação suave
- **Shadow**: Apenas para elementos flutuantes (modais, dropdowns)

#### Botões

**Primary (Dourado) - Ações Principais**
```tsx
<Button>
  - Background: bg-primary (dourado)
  - Texto: text-primary-foreground (preto)
  - Hover: Elevação automática
  - Border: Automático, mais escuro
</Button>
```

**Secondary - Ações Secundárias**
```tsx
<Button variant="secondary">
  - Background: bg-secondary
  - Texto: text-secondary-foreground
  - Uso: Ações menos importantes
</Button>
```

**Outline - Ações Terciárias**
```tsx
<Button variant="outline">
  - Border: border-border
  - Background: Transparente
  - Hover: bg-accent
  - Uso: Cancelar, voltar
</Button>
```

**Ghost - Navegação**
```tsx
<Button variant="ghost">
  - Completamente transparente
  - Hover: Elevação sutil
  - Uso: Ícones, navegação discreta
</Button>
```

#### Badges de Status

**Sucesso** (Verde)
```tsx
<Badge className="bg-success/10 text-success border-success/20">
  Concluído
</Badge>
```

**Warning** (Amarelo)
```tsx
<Badge className="bg-warning/10 text-warning border-warning/20">
  Pendente
</Badge>
```

**Error** (Vermelho)
```tsx
<Badge className="bg-destructive/10 text-destructive border-destructive/20">
  Erro
</Badge>
```

**Info** (Azul)
```tsx
<Badge className="bg-info/10 text-info border-info/20">
  Em Análise
</Badge>
```

#### Inputs e Forms

- **Height padrão**: 40px (h-10)
- **Border**: `border-input` (cinza médio)
- **Focus**: Ring dourado `ring-primary`
- **Placeholder**: `text-muted-foreground`
- **Disabled**: Opacidade 50%, cursor não permitido
- **Error**: Border vermelho, mensagem abaixo

#### Tabelas

- **Header**: 
  - Background: `bg-muted/50`
  - Texto: `text-muted-foreground`
  - Font: `text-sm font-medium`
  - Border bottom: `border-b border-border`
  
- **Rows**:
  - Hover: `hover:bg-muted/50`
  - Border: `border-b border-border` (última sem borda)
  - Padding: `py-3` (vertical)
  
- **Números**: Sempre `tabular-nums` para alinhamento

### Iconografia

**Biblioteca**: Lucide React
- Ícones outline (stroke) para consistência
- Tamanho padrão: 20px (h-5 w-5)
- Ícones pequenos (badges): 16px (h-4 w-4)
- Ícones grandes (hero/feature): 48px (h-12 w-12)
- Cor padrão: Herda do texto ou `text-muted-foreground`

**Ícones Especiais**
- **Logo**: FileCheck (dourado)
- **Sucesso**: CheckCircle (verde)
- **Erro**: AlertCircle (vermelho)
- **Atenção**: AlertTriangle (amarelo)
- **Info**: Info (azul)

### Animações e Transições

#### Princípios

- **Sutileza**: Animações discretas e elegantes
- **Rapidez**: Durações curtas (150-250ms)
- **Propósito**: Cada animação tem função clara
- **Acessibilidade**: Respeitar `prefers-reduced-motion`

#### Sistema de Elevação

**Hover** (`hover-elevate`)
```css
- Adiciona overlay dourado transparente ao hover
- Duração: 200ms
- Easing: ease-in-out
```

**Active** (`active-elevate-2`)
```css
- Overlay dourado mais intenso ao clicar
- Duração: 150ms
- Feedback tátil imediato
```

#### Upload de Documentos

- **Drag enter**: Border dourado, background primary/5, scale 1.02
- **Drop**: Animação de fade-in dos arquivos
- **Upload**: Progress bar animada com cor primary

### Dados e Visualizações

#### Progress Bars

```tsx
<Progress value={75} className="h-2">
  - Background: bg-muted
  - Fill: bg-primary (dourado)
  - Animação: Suave, 300ms
</Progress>
```

#### Números e Métricas

- **Tamanho grande**: text-2xl (24px) para valores principais
- **Font tabular**: Sempre `tabular-nums`
- **Cores semânticas**: 
  - Verde: Valores positivos, crescimento
  - Vermelho: Valores negativos, decréscimo
  - Dourado: Valores neutros importantes

#### Gráficos (Recharts)

**Cores dos Charts:**
1. Dourado `hsl(45 60% 65%)` - Primário
2. Verde `hsl(160 78% 55%)` - Sucesso
3. Amarelo `hsl(42 100% 60%)` - Warning
4. Roxo `hsl(280 60% 65%)` - Adicional
5. Laranja `hsl(20 70% 60%)` - Adicional

### Responsividade

#### Breakpoints

```
sm:  640px  - Smartphones landscape
md:  768px  - Tablets portrait
lg:  1024px - Tablets landscape / Laptops
xl:  1280px - Desktops
2xl: 1536px - Large desktops
```

#### Estratégia

- **Desktop First**: Design otimizado para profissionais em desktop
- **Mobile**: Sidebar colapsável, cards em stack
- **Tablet**: Layout intermediário otimizado
- **Tabelas**: Scroll horizontal em mobile quando necessário

### Acessibilidade

#### Contraste
- **Mínimo**: WCAG AA (4.5:1 para texto normal)
- **Preferencial**: WCAG AAA (7:1 para texto importante)
- **Dourado sobre preto**: Excelente contraste
- **Verde sobre preto**: Ótimo contraste

#### Navegação
- **Focus States**: Ring dourado sempre visível
- **Keyboard**: Todos os elementos interativos acessíveis
- **ARIA Labels**: Em ícones e controles sem texto
- **Data-testid**: Em todos os elementos interativos

### Voz e Tom Visual

#### Características

- **Premium**: Detalhes cuidadosos, acabamento refinado
- **Profissional**: Nunca casual ou despojado
- **Confiável**: Informações claras, organizadas, precisas
- **Sofisticado**: Uso elegante de dourado e preto
- **Objetivo**: Foco em dados, resultados e eficiência

#### Evitar

- ❌ Cores vibrantes demais (exceto nas específicas da marca)
- ❌ Animações excessivas ou chamativas
- ❌ Gradientes coloridos (usar apenas sutis)
- ❌ Sombras exageradas
- ❌ Fontes decorativas ou script

### Guidelines de Implementação

#### Sempre Usar

✅ Componentes Shadcn quando disponíveis
✅ Sistema de cores via CSS variables
✅ Classes utilitárias Tailwind
✅ Sistema `hover-elevate` para interações
✅ Fonte Inter exclusivamente
✅ `data-testid` em elementos interativos
✅ `tabular-nums` para números
✅ Modo escuro como padrão

#### Nunca Fazer

❌ Hard-code de cores (usar variables)
❌ Espaçamentos inconsistentes
❌ Animações longas (>300ms)
❌ Mudar paleta primary (dourado)
❌ Ignorar modo escuro
❌ Misturar ícones de bibliotecas diferentes
❌ Usar Comic Sans (óbvio, mas vale mencionar)

### Exemplos de Implementação

#### Card de Caso Previdenciário
```tsx
<Card className="hover-elevate">
  <CardHeader className="flex-row items-center justify-between">
    <div className="flex items-center gap-3">
      <Avatar className="border-2 border-primary/30">
        <AvatarFallback className="bg-primary/20 text-primary">
          MS
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-semibold">Maria Silva</h3>
        <p className="text-sm text-muted-foreground">28 anos, 4 meses</p>
      </div>
    </div>
    <Badge className="bg-success/10 text-success border-success/20">
      Concluído
    </Badge>
  </CardHeader>
  <CardContent>
    <Progress value={100} />
  </CardContent>
</Card>
```

#### Botão de Nova Ação
```tsx
<Button className="gap-2">
  <Plus className="h-4 w-4" />
  Novo Caso
</Button>
```

#### Badge com Ícone
```tsx
<Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
  <AlertCircle className="h-3 w-3 mr-1" />
  3 pendências
</Badge>
```

---

**Última atualização**: Outubro 2025  
**Versão**: 2.0 - DZAMB Premium  
**Baseado em**: Material de referência do curso DZAMB
