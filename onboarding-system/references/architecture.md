# Arquitetura — Os 5 componentes do onboarding

Este documento descreve o desenho lógico que se mantém **igual em qualquer stack**. A sintaxe muda; a arquitetura não.

## Visão geral do fluxo de dados

```
┌──────────────────────────────────────────────────────────────────┐
│            Storage (DB row / Document / localStorage)            │
│                       OnboardingState JSON                       │
└─────────────────┬────────────────────────────┬──────────────────┘
                  │ read on login              │ write on action
                  ▼                            ▲
┌──────────────────────────────────────────────────────────────────┐
│                  Server boundary (action / API)                  │
│       getOnboardingState() / updateOnboardingState(patch)        │
└─────────────────┬────────────────────────────┬──────────────────┘
                  │ initial state              │ patches
                  ▼                            ▲
┌──────────────────────────────────────────────────────────────────┐
│                 OnboardingProvider (client-side)                 │
│  state, update(patch), startInitialTour, startModuleTour,        │
│  markWelcomeSeen, markTourSeen, openHelp, closeHelp,             │
│  activeTour, isHelpOpen                                          │
└──┬──────────────┬─────────────┬─────────────┬──────────────┬────┘
   ▼              ▼             ▼             ▼              ▼
┌──────┐    ┌─────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐
│Tour  │    │Module   │   │HelpFab   │   │Guide tab │  │Chat tab  │
│engine│    │welcome  │   │+ panel   │   │renders   │  │searches  │
│(lib) │    │modal    │   │(always)  │   │markdown  │  │markdown  │
└──────┘    └─────────┘   └──────────┘   └──────────┘  └──────────┘
```

## O `OnboardingState`

Estrutura canônica armazenada (em JSONB, document, ou JSON serializado):

```json
{
  "version": 1,
  "completed_initial_tour": false,
  "dismissed_initial_tour": false,
  "module_welcomes_seen": ["agenda", "patients"],
  "module_tours_seen": ["agenda"],
  "last_seen_at": "2026-05-24T10:00:00Z"
}
```

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `version` | int | Schema version. Quando bumpa, todo o estado é zerado e o tour roda de novo para usuários antigos. Permite refazer o onboarding após mudanças grandes no produto. |
| `completed_initial_tour` | bool | Usuário concluiu o tour de boas-vindas até o último passo. |
| `dismissed_initial_tour` | bool | Usuário pulou o tour antes do fim. Trate como "não mostrar mais automaticamente", mas distinguível de `completed` no painel de ajuda. |
| `module_welcomes_seen` | string[] | IDs dos módulos cujo modal de boas-vindas já foi visto/pulado. |
| `module_tours_seen` | string[] | IDs dos módulos cujo tour já foi concluído. Usado para badges "✓ Visto" no painel. |
| `last_seen_at` | ISO timestamp | Última atualização. Útil para diagnóstico e métricas. |

**Regra de derivação**:
- `shouldShowInitialTour(state)` → `!completed && !dismissed`
- `shouldShowModuleWelcome(state, moduleId)` → `!module_welcomes_seen.includes(moduleId)`

**Helpers puros** (implemente-os sem I/O, retornando novos objetos imutáveis):

- `defaultOnboardingState()`
- `normalizeOnboardingState(raw)` — recebe o JSON do storage, valida tipos, aplica defaults para campos faltantes, e **zera tudo se `version` divergir do esperado**.
- `markModuleWelcomeSeen(state, id)`
- `markModuleTourSeen(state, id)`

## Componente 1 — Tour inicial

**Responsabilidade**: guiar o novo usuário pelo fluxo dourado (4-6 ações que geram primeiro valor) na primeira vez que ele entra na rota principal.

**Comportamento**:
- Auto-inicia somente quando: `shouldShowInitialTour(state)` é true **E** pathname corresponde à rota inicial (ex: `/dashboard`, `/app`, `/home`). Em outras rotas, não auto-inicia (mas pode ser reaberto manualmente).
- Delay de ~600-1000ms antes de iniciar — dá tempo do DOM montar e do skeleton/loading sumir.
- Cada passo aponta para um seletor estável: prefira `[data-onboarding="<id>"]` em vez de classes ou IDs frágeis.
- Filtre passos cujo elemento não existe no DOM **antes** de iniciar o tour. Se sobrarem 0, não inicie.
- Ao concluir o último passo → `update({ completed_initial_tour: true })`.
- Ao pular antes do fim → `update({ dismissed_initial_tour: true })`.

**Passos sugeridos para o tour inicial (4-7 passos é o sweet spot)**:
1. Mensagem de boas-vindas (sem seletor, centralizada).
2. Spotlight no menu principal: "Aqui você navega entre os módulos."
3. Indicadores do dashboard: "Suas métricas aparecem aqui."
4. Ação A do fluxo dourado (ex: "Criar X").
5. Ação B do fluxo dourado (ex: "Cadastrar Y").
6. Spotlight no FAB de ajuda: "Precisou de ajuda, clique aqui."
7. Mensagem de despedida (sem seletor).

**O que NÃO incluir**: detalhes operacionais, features secundárias, integrações. Deixe para os tours de módulo.

## Componente 2 — Modal de boas-vindas por módulo

**Responsabilidade**: na primeira visita a cada módulo (CRM, Estoque, Financeiro, etc.), apresentar o módulo em 1 parágrafo e oferecer um tour específico daquele módulo.

**Comportamento**:
- Dispara só se: `state.completed_initial_tour === true` (não atrapalhe o usuário ainda no tour inicial) **E** `shouldShowModuleWelcome(state, moduleId)` **E** o módulo tem um tour configurado (ou ao menos uma descrição).
- Mapeie pathname → moduleId via função pequena (`/agenda*` → `agenda`, `/patients*` → `patients`, etc.).
- Delay ~400-600ms ao trocar de rota.
- Conteúdo: ícone + título "Conheça o módulo X" + 1 parágrafo de descrição + 2 botões: "Fazer tour" (primário) e "Pular por agora" (secundário).
- Ambos os botões marcam `markModuleWelcomeSeen(moduleId)`. "Fazer tour" adicionalmente chama `startModuleTour(moduleId)`.
- Se o módulo ainda não tem tour configurado, mostre só "Entendi" (botão único).

**Registry de módulos**: mantenha em um único arquivo (`module-tours.ts`/`.js`/`.py`/etc.) com a estrutura:

```ts
{
  id: 'agenda',
  label: 'Agenda',
  description: 'Crie, edite e visualize todos os agendamentos.',
  path: '/agenda',
  icon: CalendarIcon,
  steps: [
    { selector: '[data-onboarding="agenda-new"]', title: 'Novo agendamento', description: '...' },
    ...
  ]
}
```

## Componente 3 — Floating Action Button (FAB) de ajuda

**Responsabilidade**: oferecer acesso permanente ao sistema de ajuda em todas as páginas autenticadas.

**Especificações visuais (recomendadas)**:
- Botão circular ~56×56px.
- Posição: `fixed`, canto inferior direito. Em mobile, suba 80-100px acima do nav inferior (`bottom: 96px`); em desktop, fique a `bottom: 24px`.
- Cor: principal da marca, com sombra suave.
- Ícone: símbolo universal de ajuda (interrogação, `HelpCircle`).
- Atributos: `aria-label="Abrir central de ajuda"`, `data-onboarding="help-fab"` (o tour inicial aponta para ele).
- Hover: leve scale + transição.

**Comportamento**:
- Click → abre painel lateral (desktop) ou modal fullscreen (mobile).
- Painel tem 3 abas: **Tour**, **Guia de uso**, **Tire dúvidas**.
- Se o produto tiver um modo "instalar PWA" ou outro elemento fixo no mesmo canto, ajuste z-index ou empilhamento.

## Componente 4 — Painel de ajuda (3 abas)

### Aba "Tour"
- Lista os tours disponíveis com botão de ação:
  - Tour de boas-vindas (sempre presente) — botão "Reiniciar".
  - Cada módulo com tour configurado — botão "Iniciar" ou badge "✓ Visto" + "Reiniciar".
- Rodapé: botão "Resetar tudo" (com `confirm()`) que zera o `OnboardingState`. Útil para QA e usuários que querem refazer.

### Aba "Guia de uso"
- Carrega o markdown estático (`ONBOARDING.md`) do produto. Em SPA, faça `fetch('/onboarding.md')` ou import direto (depende do bundler).
- Renderize com um parser markdown leve. Se você não quer adicionar dependência (`marked`, `react-markdown`), implemente um parser caseiro em ~60 linhas suportando: `#`/`##`/`###`, `**bold**`, `*italic*`, `[text](url)`, `- listas`, `> blockquotes`, parágrafos. **Escape HTML primeiro** para evitar XSS.
- Estilo: largura confortável de leitura (~70 chars), tipografia legível, headings hierárquicos.
- Aceitável: âncoras automáticas em headings (`#como-cadastro-paciente`) para deep-linking futuro.

### Aba "Tire dúvidas" (chatbot)
- Carrega no mount o markdown e indexa as FAQs (uma vez, com cache).
- Conversa stateless (não persiste entre aberturas).
- Mensagem inicial do bot: saudação + 3 perguntas sugeridas (clicáveis).
- Input: textarea auto-grow, Enter envia, Shift+Enter quebra linha.
- Resposta: bolha do bot com markdown inline básico (`**bold**`, quebras `\n`). Se houver perguntas relacionadas, mostre 2-3 chips clicáveis abaixo.
- Sem match: mensagem de fallback honesta ("Não encontrei resposta direta — tente reformular ou consulte o Guia") + 3 perguntas mais comuns como sugestão.

Veja `search-algorithm.md` para o motor de busca.

## Componente 5 — Guia em markdown

Arquivo único, idiomaticamente em pt-BR (ou idioma do produto), com a estrutura:

```
# Guia de uso

## Primeiros passos
## [Módulo 1]
### Como [ação]
### Como [outra ação]
## [Módulo 2]
...

## FAQ
### Pergunta natural?
Resposta em 1-3 frases, **negrito** para botões/menus.

### Outra pergunta?
...
```

A seção `## FAQ` é parseada pelo chatbot. Cada `###` dentro dela é uma entrada Q&A. Veja `markdown-guide-template.md` para o template completo.

## Integração com o layout

O onboarding precisa que **três elementos** estejam montados em todas as páginas autenticadas:

```
<AuthenticatedLayout>
  <OnboardingProvider initialState={...}>
    <Sidebar />
    <main>{children}</main>
    
    <!-- Esses três sempre presentes -->
    <InitialTour />        <!-- invisível, só efeito -->
    <ModuleWelcomeModal /> <!-- abre conforme rota -->
    <HelpFab />            <!-- visível -->
  </OnboardingProvider>
</AuthenticatedLayout>
```

O `OnboardingProvider`:
- Recebe `initialState` (vindo do server / API / localStorage).
- Mantém o estado em memória client-side com `useState` (ou equivalente em Vue/Angular).
- Expõe métodos que aplicam o patch local **imediatamente** (atualização otimista) e disparam a persistência server-side em paralelo. Em caso de erro de persistência, **não rollback** — o estado de onboarding é não-crítico; logue e siga.

## Seletores de âncora

Use atributos `data-*` em vez de classes CSS frágeis para identificar elementos no tour:

```html
<button data-onboarding="agenda-new">Novo agendamento</button>
<input data-onboarding="patients-search" />
<div data-onboarding="dashboard-metrics">...</div>
```

Vantagens:
- Não acoplam ao CSS — mudanças visuais não quebram tours.
- Auto-documentado — quem lê o código sabe que aquele elemento faz parte do onboarding.
- Buscável: `grep -r 'data-onboarding'` lista todos os pontos de integração.

**Padrão de nomenclatura**: `<modulo>-<acao>` (ex: `agenda-new`, `patients-search`, `crm-pipeline`, `help-fab`).

## Casos especiais

- **Página de assinatura bloqueada**: se o produto bloqueia o sistema quando a assinatura expira, NÃO renderize o onboarding nessas páginas. Coloque um guard no `OnboardingProvider`.
- **Múltiplos papéis (admin/staff)**: alguns módulos só existem para certos papéis. Filtre os tours/welcomes pelos módulos visíveis ao papel atual.
- **Multi-tenant**: o estado é por usuário, não por tenant. Se o mesmo usuário pertence a múltiplos tenants, considere se a versão deve resetar ao trocar de tenant (geralmente não).
- **PWA/Standalone**: garanta que o FAB não colide com a barra de status iOS.
- **Tema escuro**: as cores do tour devem respeitar o tema atual. Algumas libs (Driver.js) precisam de override de CSS.
