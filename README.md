# skills_fg

Coleção pessoal de skills reutilizáveis mantida por [@fernandosg21](https://github.com/fernandosg21).

Cada pasta contém uma skill independente. As funcionalidades do Memora System foram transformadas em contratos portáteis para serem adaptados a novos sistemas, sem exigir PHP, MySQL ou a arquitetura original.

## Catálogo

### Plataforma SaaS e segurança

| Skill | Finalidade |
|---|---|
| [secure-multitenant-saas](./secure-multitenant-saas) | Isolamento por tenant, ownership, tokens, jobs e índices compostos. |
| [manage-tenant-module-access](./manage-tenant-module-access) | Registry e gates de módulos públicos, desligados ou exclusivos. |
| [manage-tenant-users-permissions](./manage-tenant-users-permissions) | Usuários, convites, papéis, permissões, sessões e 2FA. |
| [build-saas-auth-subscription-lifecycle](./build-saas-auth-subscription-lifecycle) | Cadastro, verificação, login, OAuth, trial e ciclo da assinatura. |
| [implement-asaas-checkout](./implement-asaas-checkout) | Checkout, cobranças, webhooks e reconciliação no Asaas. |
| [build-saas-referral-credits](./build-saas-referral-credits) | Indicações, recompensas e créditos de renovação por ledger. |
| [operate-saas-control-plane](./operate-saas-control-plane) | Painel interno para operar tenants, planos, trials e jobs. |
| [migrate-tenant-data-safely](./migrate-tenant-data-safely) | Exportação, importação, cutover, reconciliação e rollback. |
| [build-modular-admin-dashboard](./build-modular-admin-dashboard) | Tela inicial por usuário com blocos, presets e fallback. |
| [onboarding-system](./onboarding-system) | Tour, boas-vindas, guia e ajuda no primeiro acesso. |
| [build-ai-help-center](./build-ai-help-center) | Central de ajuda curada com respostas de IA ancoradas. |
| [replicate-update-stories](./replicate-update-stories) | Stories de novidades, classificação editorial e estado de leitura. |
| [collect-in-app-product-feedback](./collect-in-app-product-feedback) | Coleta e triagem segura de bugs, sugestões e elogios. |
| [build-in-app-notification-center](./build-in-app-notification-center) | Alertas in-app deduplicados, acionáveis e multi-canal. |

### Marketing, aquisição e CRM

| Skill | Finalidade |
|---|---|
| [build-product-led-saas-site](./build-product-led-saas-site) | Site público rápido com evidências reais do produto e preços canônicos. |
| [build-photography-crm](./build-photography-crm) | CRM para fotografia e eventos, do lead ao fechamento. |
| [automate-crm-followups](./automate-crm-followups) | Cadências, tarefas, recorrência e follow-ups idempotentes. |
| [build-link-in-bio-lead-funnel](./build-link-in-bio-lead-funnel) | Link na bio white-label com formulário, publicação e métricas. |
| [build-client-partner-directory](./build-client-partner-directory) | Diretório de parceiros confiáveis para indicar a clientes. |
| [build-public-budget-request](./build-public-budget-request) | Links públicos de orçamento integrados ao CRM. |
| [build-public-proposal-flow](./build-public-proposal-flow) | Propostas rastreáveis com pacotes, aceite, evento e PDF. |
| [build-saas-sales-success-agent](./build-saas-sales-success-agent) | Vendas e sucesso do próprio SaaS via WhatsApp. |
| [create-cep-address-autocomplete](./create-cep-address-autocomplete) | Endereço brasileiro com CEP primeiro e preenchimento seguro. |

### Eventos, contratos e financeiro

| Skill | Finalidade |
|---|---|
| [manage-photography-events](./manage-photography-events) | Ciclo completo do evento, da reserva à conclusão. |
| [build-event-calendar-sync](./build-event-calendar-sync) | Agenda, bloqueios, conflitos, convites e sincronização externa. |
| [manage-freelancer-operations](./manage-freelancer-operations) | Escala, disponibilidade, ranking, pagamentos e acertos de equipe. |
| [contratos-assinatura-digital-br](./contratos-assinatura-digital-br) | Contratos, documentos, assinatura eletrônica e evidências no Brasil. |
| [build-photography-finance](./build-photography-finance) | Contas, parcelas, caixa, extrato, DRE, salários e previsões. |
| [build-photography-pricing-engine](./build-photography-pricing-engine) | Custos, impostos, margem, preço mínimo e composição de pacotes. |
| [orchestrate-post-event-workflow](./orchestrate-post-event-workflow) | Etapas e prazos de seleção, edição, álbum, galeria e entrega. |
| [manage-album-production](./manage-album-production) | Pedidos de álbum, encadernadora, custos e sincronização. |

### Proof, seleção e galerias

| Skill | Finalidade |
|---|---|
| [create-digital-album-proof-flow](./create-digital-album-proof-flow) | Criação inicial de projeto de álbum digital. |
| [build-photo-selection-proof](./build-photo-selection-proof) | Seleção de fotos com limite, marca d'água e finalização. |
| [build-album-proofing-workflow](./build-album-proofing-workflow) | Versões, comentários, correções e aprovação de diagramado. |
| [build-secure-photo-gallery-pwa](./build-secure-photo-gallery-pwa) | Galeria privada, downloads, convidados, ZIP, impressão e PWA. |
| [integrate-white-label-proof](./integrate-white-label-proof) | Integração de contas, marca, clientes, projetos e planos do Proof. |

### WhatsApp, IA e dados

| Skill | Finalidade |
|---|---|
| [agente-atendimento-whatsapp](./agente-atendimento-whatsapp) | Atendimento autônomo confiável com inbox, outbox e guardrails. |
| [schedule-reliable-whatsapp-messages](./schedule-reliable-whatsapp-messages) | Fila agendada, aprovação, claim, retry e reconciliação. |
| [analyze-private-chat-exports](./analyze-private-chat-exports) | Análise de conversas exportadas com redação de PII. |
| [build-reliable-llm-router](./build-reliable-llm-router) | Roteamento multi-provedor com deadline, fallback e cooldown. |
| [build-operational-agent-api](./build-operational-agent-api) | API segura para agentes executarem tarefas operacionais. |
| [build-ai-content-blog](./build-ai-content-blog) | Blog assistido por IA com base factual, revisão, SEO e publicação. |
| [build-consent-aware-analytics](./build-consent-aware-analytics) | Analytics e pixels condicionados a consentimento e sem PII. |
| [humanizar-texto](./humanizar-texto) | Escrita natural, menos robótica e alinhada à voz do autor. |
| [medidor-uso-ia](./medidor-uso-ia) | Medição de tokens, custo e consumo de LLM por tenant. |

### Capacidades especializadas

| Skill | Finalidade |
|---|---|
| [build-photo-contest-platform](./build-photo-contest-platform) | Concurso fotográfico com upload, júri cego, resultado e retenção. |
| [create-scroll-video-hero](./create-scroll-video-hero) | Hero com vídeo controlado pelo progresso da rolagem. |
| [criar-paginas-de-erro-personalizadas](./criar-paginas-de-erro-personalizadas) | Páginas de erro humanizadas, responsivas e alinhadas à identidade visual, com HTML acessível, artes separadas e status HTTP reais. |
| [separar-arte-em-camadas-psd](./separar-arte-em-camadas-psd) | Conversão de arte achatada em PSD organizado por camadas. |

## Como usar

Escolha a pasta da capacidade desejada e instale-a no diretório de skills aceito pelo seu agente. Exemplos comuns:

    ~/.codex/skills/<nome-da-skill>/
    ~/.claude/skills/<nome-da-skill>/

Também é possível manter a skill no próprio projeto quando o agente oferece descoberta local.

Ao pedir uma implementação, invoque a skill pelo nome e forneça o repositório ou artefatos do sistema alvo. A skill orienta a auditoria do estado real, a adaptação ao stack, a implementação e a validação.

## Estrutura

Uma skill normalmente contém:

    <nome-da-skill>/
    ├── SKILL.md
    ├── agents/
    │   └── openai.yaml
    ├── references/
    ├── scripts/
    └── assets/

Somente os recursos necessários aparecem em cada pasta. O arquivo obrigatório é SKILL.md; referências e scripts são carregados sob demanda.

## Princípio de portabilidade

Os nomes de tabelas, rotas e helpers do Memora servem como evidência histórica, não como dependências. Ao aplicar uma skill:

1. audite o sistema alvo;
2. preserve os contratos de negócio e segurança;
3. adapte banco, linguagem, framework e provedores;
4. valide o fluxo de ponta a ponta;
5. não copie segredos nem dados de produção.

## Licença

MIT. Você pode copiar, adaptar e redistribuir.
