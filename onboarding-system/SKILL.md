---
name: onboarding-system
description: Implementa um sistema de onboarding completo (tour guiado no primeiro uso, modais de boas-vindas por módulo, botão de ajuda persistente, guia em markdown e chatbot local sem IA) em qualquer aplicação web. Use SEMPRE que o usuário pedir onboarding, tour guiado, walkthrough, first-time user experience (FTUE), help center, tutorial in-app, user guide, dicas de uso, modal de boas-vindas, central de ajuda, ou pedir para guiar novos usuários — independente do stack (React, Next.js, Vue, Angular, Svelte, Django, Rails, Laravel, ASP.NET, etc.) e do banco (Postgres, MySQL, MongoDB, SQLite, Firebase, Supabase, etc.). Também acione esta skill quando o usuário disser coisas como "reduzir tempo até primeiro valor", "diminuir churn de trial", "facilitar primeiro acesso", "ajudar o usuário a descobrir features".
---

# Onboarding System

Skill para implementar um sistema de onboarding **completo e agnóstico de stack** em aplicações web. O resultado entregue ao usuário deve cobrir cinco componentes integrados (tour guiado, modais por módulo, FAB de ajuda, guia em markdown, chatbot local) e adaptar-se ao stack/persistência que o projeto já usa, sem introduzir dependências exóticas.

## Por que esta skill existe

Onboarding bem feito é caro de improvisar: a maioria das tentativas vira ou um modal que ninguém lê, ou uma documentação que ninguém abre. As cinco peças combinadas resolvem isso, mas só funcionam juntas — e exigem decisões coerentes sobre persistência, descobribilidade e tom. Esta skill capturou as decisões que funcionam e o método para adaptá-las a qualquer projeto.

## Workflow (siga em ordem)

A skill é dividida em três fases. Cada fase termina com decisões registradas que alimentam a próxima — não pule.

### Fase 1 — Diagnóstico do sistema

Antes de propor qualquer código, você precisa entender o sistema. Investigue (use Glob/Grep/Read; se houver `Explore` subagent disponível, prefira-o):

1. **Stack identificado**:
   - Framework frontend (React/Next/Vue/Angular/Svelte/server-rendered templates)
   - Linguagem (TypeScript/JavaScript/Python/Ruby/PHP/C#/Go)
   - Estilização (Tailwind/CSS modules/styled-components/Bootstrap/MUI/Chakra)
   - State management (Context/Redux/Zustand/Pinia/Vuex/Signals)
2. **Persistência disponível**:
   - Banco de dados (SQL — Postgres/MySQL/SQLite; NoSQL — Mongo/Firestore; BaaS — Supabase/Firebase)
   - Como se identifica o usuário logado (sessão, JWT, cookie, auth context)
   - Onde fica a tabela/coleção de usuários
3. **Layout principal**:
   - Onde mora o "shell" (sidebar + topbar + main) compartilhado por todas as páginas autenticadas
   - Onde plugar um Floating Action Button (FAB) que aparece em toda página autenticada sem colidir com nav mobile
4. **Idioma e tom do produto**: leia 3-4 textos existentes (botões, mensagens) para herdar o tom.
5. **Páginas/módulos a cobrir**: liste as rotas autenticadas. Identifique quais 4-5 são as do **fluxo dourado** (que geram primeiro valor) — só essas entram no tour inicial.
6. **Bibliotecas de tour já instaladas**: grep por `driver.js`, `intro.js`, `shepherd`, `react-joyride`, `vue-tour`, `ng-introjs`, `bootstrap-tour`. Se já existir, reuse.

Em seguida, **pergunte ao usuário** (use AskUserQuestion se disponível, ou pergunte em texto):

- **Persistência do estado de onboarding**: campo no DB (sincroniza entre dispositivos) ou `localStorage` (mais simples, perde ao trocar de navegador)? Recomende DB se o sistema já tem auth e tabela de usuários.
- **Escopo**: cobrir todas as páginas no v1 ou só o fluxo dourado + modais leves nas demais? Recomende o segundo.
- **Chatbot**: incluir agora ou só preparar o markdown? Recomende incluir — é busca local, custo zero.
- **Onde colocar o botão de ajuda persistente**: FAB no canto inferior direito (recomendado) ou item no menu lateral.
- **Idioma do conteúdo**: confirme. Por padrão herde do produto.

Registre as respostas em uma seção "Decisões aprovadas" antes de codar. Se estiver em modo de plano, escreva-as no plan file.

### Fase 2 — Design e seleção de adaptadores

Com diagnóstico em mãos, escolha:

- **Biblioteca de tour**: consulte `references/stack-adapters.md` para a recomendação por stack (Driver.js é o default para web moderna; alternativas para Vue, Angular, server-rendered).
- **Estratégia de persistência**: consulte `references/persistence-patterns.md` para o schema concreto (JSONB no Postgres, document no Mongo, key no localStorage, etc.).
- **Arquitetura dos 5 componentes**: leia `references/architecture.md` para entender as responsabilidades de cada peça e como elas conversam. Este é o documento mais importante e descreve a arquitetura comum que se mantém igual em todos os stacks.
- **Algoritmo de busca do chatbot**: leia `references/search-algorithm.md` para a implementação canônica de scoring fuzzy + diacritic-insensitive + stopwords. Adapte sintaxe para a linguagem do projeto; o algoritmo é o mesmo.
- **Estrutura do guia em markdown**: leia `references/markdown-guide-template.md` para o esqueleto que serve tanto à aba "Guia" quanto à indexação do chatbot.

Produza um **plano de implementação curto** listando: arquivos a criar, arquivos a modificar, ordem de execução, e critérios de verificação. Se possível, ofereça ao usuário antes de codar.

### Fase 3 — Implementação

Execute na ordem (esta ordem minimiza retrabalho):

1. **Persistência primeiro**: migration/schema do estado, helpers puros para normalizar o estado, e operações de leitura/escrita server-side. NÃO toque em UI ainda.
2. **Provider/contexto do onboarding**: o "núcleo client-side" que distribui estado e expõe `startTour`, `markSeen`, `resetAll`, `openHelp`, etc. Integre no layout autenticado mas ainda sem renderizar UI visível.
3. **Botão de ajuda persistente (FAB) + painel com 3 abas vazias**: já entrega valor (descobribilidade) mesmo antes dos tours estarem prontos.
4. **Tour inicial**: passos do fluxo dourado, com auto-start na rota inicial após login na primeira vez.
5. **Modal de boas-vindas por módulo + registry de tours por módulo**.
6. **Chatbot local + algoritmo de busca**.
7. **Atributos de âncora** (`data-onboarding="..."`, IDs ou classes específicas) nos elementos referenciados pelos tours.
8. **Expandir o markdown** com seções completas de cada módulo + 25-30 perguntas no FAQ.
9. **Botão "Reiniciar tour"** numa página de configurações ou perfil.
10. **Verificação manual ponta a ponta** (checklist abaixo).

**Princípio**: depois de cada item, o sistema continua funcionando. Nada quebra no meio.

## Princípios não-negociáveis

Estes são os anti-padrões que matam onboardings. Respeite mesmo sob pressão de tempo:

- **Recuperável, nunca destrutivo**: tudo o que o usuário pulou ou fechou deve continuar disponível pelo botão de ajuda. Nada some.
- **Não bloqueia trabalho real**: tours pulam silenciosamente passos cujo elemento alvo não existe no DOM e nunca impedem cliques fora do passo.
- **Idempotente**: estado vive em um único lugar canônico; o tour roda no máximo uma vez automaticamente por usuário; reabrir manualmente é sempre possível.
- **Time-to-value > completude**: o tour inicial mostra as 4-6 ações que geram primeiro valor, não as 25 features do produto. Cada passo extra é um lugar onde o usuário desiste.
- **Tom alinhado**: o copy do onboarding herda o tom do produto. Não infantilize. Não use "ué", "opa", emojis se o resto do produto não usa.
- **Custo zero de IA no chatbot**: busca local sobre o markdown. Sem chamada externa. Funciona offline.
- **Acessibilidade**: tours navegáveis por teclado (Tab/Shift+Tab/Enter/Esc). FAB com `aria-label`. Modais com foco preso.
- **Versionar o estado**: o JSONB/document de onboarding começa com `version: 1`. Quando o conteúdo do tour mudar dramaticamente, bumpe a versão e zere o estado — assim usuários antigos veem o tour novo.

## Os 5 componentes (visão de 30 segundos)

Detalhes completos em `references/architecture.md`. Visão rápida:

| Componente | Responsabilidade | Quando aparece |
|------------|------------------|----------------|
| **Tour inicial** | Spotlight passo-a-passo no fluxo dourado | Auto no 1º login, na rota inicial |
| **Modal de boas-vindas por módulo** | "Conheça o módulo X" com [Fazer tour] [Pular] | 1ª visita a cada rota de módulo |
| **FAB de ajuda** | Botão sempre visível (canto inferior direito) | Em todas as páginas autenticadas |
| **Guia em markdown** | Documentação interna renderizada na aba "Guia" do FAB | Quando o usuário abre o FAB |
| **Chatbot local** | Busca fuzzy sobre as FAQs do markdown | Aba "Tire dúvidas" do FAB |

Os cinco compartilham um único `OnboardingState` (persistido) que registra: tour inicial completou/dismissou, módulos cujo welcome já foi visto, módulos cujo tour já foi visto, versão do schema, last_seen_at.

## Checklist de verificação

Use ao final da implementação. Marque cada item antes de declarar pronto:

- [ ] Usuário novo (estado vazio) → tour inicial abre automaticamente na rota dourada
- [ ] Avançar até o fim → marca `completed=true`; recarregar não dispara de novo
- [ ] Pular no meio → marca `dismissed=true`; recarregar não dispara de novo
- [ ] Visitar cada módulo pela 1ª vez → modal de boas-vindas abre
- [ ] Clicar "Pular" no modal → não abre mais naquela rota
- [ ] FAB visível em toda página autenticada, não colide com nav mobile
- [ ] FAB → "Reiniciar tour" → tour roda de novo e estado zera corretamente
- [ ] Configurações → "Reiniciar onboarding" → mesma coisa
- [ ] Chatbot responde "como cadastro paciente" e "Como Cadastro Paciente?" e "como cadastro pacientes" (case + acentos + plural)
- [ ] Chatbot diante de query sem match → mensagem fallback + 3 perguntas sugeridas
- [ ] Guia renderiza com headings, negrito, listas
- [ ] Cross-device (se persistência for DB): concluir num dispositivo, abrir noutro → tour NÃO abre
- [ ] Build de produção do projeto passa limpo
- [ ] Lint/typecheck passam limpos
- [ ] Tour é navegável por teclado (Tab, Esc)
- [ ] Migration/schema é reversível (downgrade existe ou é trivial)

## Quando consultar cada reference

Carregue só o que precisar. As referências são independentes.

- **`references/architecture.md`** — Sempre. Contém o desenho dos 5 componentes, os fluxos de dados e o shape do `OnboardingState`. Leia antes de codar qualquer linha.
- **`references/stack-adapters.md`** — Quando precisar escolher a lib de tour ou entender como integrar a um framework específico (React/Vue/Angular/server-rendered). Tem snippets de exemplo por stack.
- **`references/persistence-patterns.md`** — Quando precisar decidir e implementar onde guardar o estado (SQL JSONB, Mongo, Firestore, localStorage, cookies, Redis). Tem schemas e exemplos por backend.
- **`references/search-algorithm.md`** — Quando for implementar o chatbot. Contém o algoritmo canônico (normalização, tokenização, scoring) em pseudocódigo + exemplos em TS/Python.
- **`references/markdown-guide-template.md`** — Quando for criar/expandir o guia em markdown. Tem o esqueleto completo e regras de formatação que o parser/chatbot espera.

## Saída esperada ao final

Ao concluir, o usuário deve ter:

1. **Código de produção** integrado ao seu projeto (não em pasta separada — onboarding é feature do produto).
2. **Migration/schema** aplicável ao banco real (não só rascunho).
3. **Guia em markdown** versionado no repo, com ao menos 1 parágrafo por módulo + 20-30 FAQs.
4. **Botão "Reiniciar"** acessível em configurações.
5. **README/PR description** explicando como rodar a migration, e como o tour pode ser estendido (adicionar módulos, atualizar passos).
6. **Verificação manual** com o checklist acima documentada.

Se algum item não couber no escopo (ex: usuário pediu só o tour inicial), declare explicitamente o que ficou de fora — onboardings parciais são piores que ausentes quando o usuário esperava o pacote completo.

## Notas finais

- **Reuse antes de criar**: se o projeto já tem um sistema de Dialog/Modal, um padrão de FAB, classes Tailwind de tema, hooks de auth — use-os. Não introduza uma stack paralela.
- **Pequenos atributos de âncora valem ouro**: adicionar `data-onboarding="..."` ou IDs estáveis nos elementos âncora não muda a lógica mas torna o sistema mantenível. Faça em PR separado se for tocar muitos arquivos.
- **Versione o conteúdo**: o markdown do guia é parte do produto. Atualizar uma feature? Atualize o guia no mesmo PR.
- **Itere com dados**: depois de lançado, instrumente eventos básicos (tour iniciado, passo X concluído, pulado, FAB aberto, query no chat) para entender onde o usuário trava. Não bloqueie o lançamento por isso, mas inclua na lista de follow-ups.
