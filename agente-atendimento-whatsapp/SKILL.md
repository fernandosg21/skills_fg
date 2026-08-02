---
name: agente-atendimento-whatsapp
description: "Implementa ou audita atendimento autônomo no WhatsApp com contratos portáveis de segurança e confiabilidade: webhook autenticado e idempotente, inbox/outbox, reconciliação, concorrência sem respostas obsoletas, gates frescos, anti-eco, memória com retenção, LLM com deadline global, validação determinística de preços e compromissos, privacidade, observabilidade, testes e rollout shadow para piloto. Use para chatbot, atendente virtual, SDR ou vendedor por IA, Evolution API, Meta Cloud API, automação de leads, mensagens agendadas, respostas duplicadas, treinamento de voz por conversas ou preparação de go-live. Os contratos centrais são independentes de stack; exemplos PHP/MySQL e do Memora são adaptações históricas, não pré-requisitos."
---

# Agente autônomo de atendimento no WhatsApp

Implemente ou audite um agente que conversa em nome de uma empresa sem entregar ao LLM autoridade
sobre dinheiro, disponibilidade, compromissos ou efeitos externos. Preserve os contratos centrais
em qualquer stack e adapte somente armazenamento, provedor, domínio e idioma.

> **Deixe o LLM redigir; deixe o código autorizar, consultar, validar, persistir e entregar.**

Não ligue outbound real durante a implementação. Comece em `shadow`, use destinatários controlados
no ensaio e só avance depois dos critérios de go-live.

## Leia as referências conforme o trabalho

| Referência | Quando usar |
|---|---|
| [arquitetura-e-dados.md](references/arquitetura-e-dados.md) | Mapear o fluxo, ownership, inbox, ledger, conversas, mensagens, outbox e schema |
| [adaptadores-de-dominio-e-runtime.md](references/adaptadores-de-dominio-e-runtime.md) | Portar para outro domínio, locale, provedor, linguagem, banco ou runtime legado |
| [travas-e-guardas.md](references/travas-e-guardas.md) | Definir a ordem dos gates, pausas, opt-out, locks, rate limit e resposta segura |
| [confiabilidade-envio-e-go-live.md](references/confiabilidade-envio-e-go-live.md) | Implementar outbox, reconciliação, fila, concorrência, testes de falha e rollout |
| [ingestao-anti-eco-e-agendamento.md](references/ingestao-anti-eco-e-agendamento.md) | Integrar webhook, ACK, dedupe, eco, receipt e mensagens agendadas |
| [roteamento-llm.md](references/roteamento-llm.md) | Configurar registry, tiers, deadline, circuit breaker, fallback e parsing |
| [prompt-vendedor-consultivo.md](references/prompt-vendedor-consultivo.md) | Separar políticas, montar prompt, consultar ferramentas e validar a resposta |
| [memoria-duravel.md](references/memoria-duravel.md) | Evitar perguntas repetidas com fatos versionados, proveniência, TTL e correção |
| [seguranca-privacidade-e-governanca.md](references/seguranca-privacidade-e-governanca.md) | Tratar autenticação, tenant, segredos, consentimento, opt-out, direitos, mídia e logs |
| [painel-observabilidade-e-testes.md](references/painel-observabilidade-e-testes.md) | Criar painel read-only, ações explícitas, métricas, ledger e suíte de testes |
| [treino-de-voz-por-conversas.md](references/treino-de-voz-por-conversas.md) | Importar conversas como opção avançada, com base legal, upload seguro e scrub |

A skill irmã `medidor-uso-ia`, quando instalada, pode fornecer telemetria detalhada. Não crie
dependência obrigatória: registre localmente, no mínimo, feature, provedor, modelo, latência,
resultado, fallback e uso agregado sem prompt/resposta/PII.

## Primeiro, descubra o sistema real

Antes de editar:

1. Localize todos os entrypoints de inbound e outbound, inclusive webhook, painel, cron, CLI,
   retry, campanhas, agendamentos, testes e caminhos legados.
2. Identifique tenant, conta do canal, conversa, contato e IDs técnicos. Prove ownership em cada
   leitura e mutação; telefone sozinho não é vínculo suficiente.
3. Mapeie schema, migrações, filas, locks, transações, retenção, logs, mídia, segredos e estado da
   conexão.
4. Liste consumidores de cada campo/endpoint antes de mudar contrato.
5. Classifique o estado atual: `off`, `shadow` ou `autonomous`. Trate `learn_only`, `aprendizado` e
   nomes antigos apenas como aliases de migração para `shadow`.
6. Registre o que é código confirmado, configuração observada e hipótese. Não confunda uma
   implementação local auditada com comportamento já validado em produção.

## Invariantes que não podem depender do LLM

- Autentique e limite o webhook antes do banco de negócio, schema ou efeito; use somente o resolvedor
  mínimo de segredo pré-banco.
- Faça o inbound ser at-least-once com handler idempotente e inbox/ledger durável.
- Persista a intenção de outbound antes do I/O externo; use outbox com chave estável e unique.
- Trate timeout após possível aceite como `unknown`; reconcilie antes de reenviar.
- Use lock de geração por inbound e lock curto de entrega por conversa. Nunca segure a conversa
  durante a chamada ao LLM.
- Releia todos os gates imediatamente antes de confirmar a intenção/entrega.
- Faça agente, agendamento, ponte e automação compartilharem outbox, quota e reconciliador.
- Separe receipt/status técnico de mensagem conversacional; receipt não atualiza atividade humana.
- Valide por código preço, moeda, disponibilidade, desconto, compromisso e ferramenta solicitada.
- Persista fatos de inbound autenticada com proveniência; marque perguntas/claims de outbound
  somente após a fronteira de entrega definida pelo canal.
- Mantenha GET administrativo sem efeitos; toda mutação exige POST, autorização e CSRF.
- Minimize antes do INSERT e antes do LLM. Nunca grave prompt, resposta ou erro bruto em produção.
- Separe ativação pelo dono de consentimento do destinatário; opt-out bloqueia novos envios.

Sem idempotência do provedor ou reconciliação conclusiva, descreva outbound como
**effectively-once**, não como exactly-once.

## Contratos portáveis

Implemente portas equivalentes, mesmo que os nomes mudem:

```text
TenantResolver             -> prova tenant + channel account
ContactIdentityResolver    -> resolve contato sem colisão ambígua
WebhookAuthenticator       -> valida assinatura/segredo do corpo bruto
InboxStore                 -> dedupe, lease, retry e estado terminal do evento
ConversationStore          -> mensagens, origem e atividade conversacional
AgentPolicy                -> computeEffectiveState + canSend
FactSchema                 -> fatos permitidos, versão, TTL e proveniência
CatalogLookup              -> dados comerciais canônicos
AvailabilityPolicy         -> disponibilidade canônica
CommitmentPolicy           -> o que pode ser prometido e por quem
HandoffPolicy              -> quando e para onde transferir
LocaleAdapter              -> telefone, moeda, data, idioma e opt-out local
LlmRouter                  -> deadline, tiers, circuit breaker e resultado validado
ReplyGrounder              -> confere afirmações e ações contra fontes canônicas
OutboxStore                -> intenção idempotente, lease, unknown, retry e dead-letter
ChannelAdapter             -> envia/reconcilia sem decidir política de negócio
AuditSink                  -> metadados seguros; nunca fonte canônica de recuperação
```

## Ordem de implementação

1. **Mapa e ameaça:** documente entrypoints, ownership, estados, efeitos e riscos.
2. **Migração controlada:** prefira o migrador nativo; mantenha DDL fora de transações de negócio.
3. **Webhook seguro:** limite bytes, autentique, resolva a conta, persista e só então ACK.
4. **Inbox/ledger:** processe o `event_id` exato com lease, retry, fencing token e dead-letter.
5. **Outbox:** crie intenção antes do provedor, chave única, estados ambíguos e reconciliador.
6. **Proveniência/anti-eco:** grave `source`, `origin_inbound_id`, `outbox_id` e IDs do provedor em
   campos próprios protegidos.
7. **Estado efetivo:** derive flags de `off|shadow|autonomous`; migre legado e exponha blockers.
8. **LLM sob orçamento:** use uma geração lógica por request, deadline global e parsing validado.
9. **Políticas e prompt:** separe guardrails imutáveis, compromissos administrativos, conteúdo do
   tenant e estilo; trate todo conteúdo externo como não confiável.
10. **Grounding:** consulte dados antes da LLM e valide resposta/ações depois; falha cai em resposta
    segura, fila ou handoff.
11. **Memória:** use schema registrável, versão, proveniência, TTL, correção e exclusão explícita.
12. **Concorrência:** gere por inbound; entregue sob trava curta e descarte resposta obsoleta.
13. **Fila/horário:** use dispatcher autenticado e monitorado; não rode worker ao abrir página.
14. **Privacidade:** implemente consentimento/opt-out, direitos, retenção, uploads e logs seguros.
15. **Painel:** mostre estado real e ofereça ações POST explícitas; não esconda blockers.
16. **Testes:** cubra lógica, adapters, processos concorrentes, crash boundaries e ensaio real
    controlado.
17. **Rollout:** observe ao menos sete dias e atinja a amostra pré-definida em shadow; ative um canário por
    tenant/conversa e mantenha kill switch para voltar a shadow.

## Regras de configuração

- Exponha um único modo canônico: `off`, `shadow`, `autonomous`.
- Derive flags técnicas durante a migração e no save; não espere o usuário salvar perfil legado.
- Reutilize a mesma função `computeEffectiveState` no runtime e na UI.
- Mantenha política de segurança/plataforma imutável pelo tenant.
- Permita que apenas administrador autorizado altere política de compromisso.
- Permita ao tenant editar catálogo, contexto comercial e estilo dentro dos limites.
- Não crie um `confidence_threshold` decorativo. Defina efeito mensurável e fallback ou remova-o.
- Não ative outbound, aprove fila ou repare provedor como efeito colateral de página/migração.

## Critérios de aceite

- [ ] Webhook inválido só consulta o resolvedor mínimo de segredo; não abre banco de negócio, não
      toca schema e não persiste evento
- [ ] Duplicata do mesmo evento produz um único resultado terminal
- [ ] Evento atrasado/fora de ordem não move a última inbound para trás
- [ ] IDs técnicos são escopados por tenant, provedor e conta do canal
- [ ] Duas execuções da mesma inbound geram uma intenção lógica
- [ ] Inbound nova durante a LLM invalida a resposta velha sem perder a nova
- [ ] Dois dispatchers não entregam a mesma intenção
- [ ] Queda após possível aceite remoto vira `unknown` e reconciliação, não retry cego
- [ ] Texto idêntico em duas saídas não causa adoção errada de eco
- [ ] Humano pausa; agente, receipt e provider echo não fingem atividade humana
- [ ] Envio humano fora do sistema é proibido, integrado ou tratado como risco explícito
- [ ] Plano, módulo, modo, pausa, opt-out, blocklist, horário, conexão e quota são relidos no final
- [ ] Revogação/takeover antes de `sending` cancela; in-flight recebe `do_not_retry` e reconciliação
- [ ] Resposta parcial atualiza perguntas/claims de outbound somente com bolhas confirmadas
- [ ] Inbound, takeover ou opt-out entre bolhas interrompe as partes restantes
- [ ] Preço, desconto, disponibilidade e compromisso são validados contra fonte canônica
- [ ] Pedido de parar registra revogação/supressão e não é retomado automaticamente
- [ ] Acesso cruzado falha fechado e não revela a existência do registro
- [ ] GET do painel não envia, repara, migra schema pesado nem executa worker
- [ ] Logs e DTOs não contêm segredo, PII, prompt, resposta ou erro bruto
- [ ] Memória/exemplos têm finalidade, versão, proveniência, TTL, correção e expurgo testável
- [ ] Testes sem credencial aparecem como `skipped`, não como aprovação falsa
- [ ] Pelo menos um caminho real é ensaiado em tenant, instância e destinatários controlados
- [ ] Shadow, canário, métricas, kill switch e rollback foram provados antes da expansão
- [ ] Amostra, SLAs, tolerância de `unknown`, heartbeat e gatilhos de rollback foram definidos

## Entrega esperada

Produza:

1. mapa ponta a ponta com entrypoints e ownership;
2. schema/migrações de inbox, ledger, mensagens, memória, outbox e auditoria;
3. adapters de provedor, domínio, locale e runtime;
4. motor de política e grounding determinístico;
5. pipeline concorrente e recuperável de inbound/outbound;
6. painel read-only com ações administrativas explícitas;
7. matriz de retenção, consentimento, direitos e resposta a incidente;
8. testes de lógica, contrato, corrida, falha e ensaio controlado;
9. relatório de blockers e plano shadow para piloto.

Declare qualquer item fora do escopo. Não descreva como “pronto para autonomia” enquanto outbox,
gates frescos, horário, deadline LLM, privacidade, segredo por instância, ensaio real e rollback
continuarem pendentes.
