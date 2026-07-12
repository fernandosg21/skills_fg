# Travas e guardas do responder autônomo

Este é o coração da skill. Um agente que responde clientes sozinho é perigoso: pode
responder duas vezes, responder mensagem velha, entrar em loop, responder num grupo, atropelar
um atendimento humano, ou queimar tokens gerando resposta que não pode ser entregue. As travas
abaixo blindam contra cada um desses casos.

Referência: `whatsapp_agent_autoreply()` em `adm/whatsapp/backend/agent_responder.php:417` +
o gate/pausas/blocklist em `adm/whatsapp/backend/ai_training.php`.

## Contrato da função central

```
autoreply(tenantId, conversationId, message, settings) -> { sent: bool, skipped_reason: string, ... }
```
Sempre retorna — nunca lança. Um helper `skip(reason)` padroniza o retorno de silêncio, e o
motivo é gravado na auditoria (ver [painel-observabilidade-e-testes.md](painel-observabilidade-e-testes.md)).
É acionada pela ingestão em toda inbound nova, **dentro de try/catch — o agente nunca derruba o
webhook** (uma exceção vira decisão `erro_interno`).

## As travas, na ORDEM EXATA

A ordem não é estética: coisas baratas e conservadoras primeiro; o que gasta LLM por último.

| # | Guarda | Motivo de silêncio | Porquê |
|---|---|---|---|
| 1 | IDs de tenant/conversa válidos | `conversa_invalida` | Abortar cedo. |
| 2 | Texto não vazio (normaliza UTF-8, trim) | `mensagem_sem_texto` | Áudio/imagem/sticker sem texto não disparam o agente. |
| 3 | Módulo ligado (canal conectado ao tenant) | `modulo_desligado` | Sem canal de saída, não há como responder. |
| 4 | **Duplo/triplo opt-in do perfil** | `perfil_nao_autonomo` | `mode==='autonomous' && autonomous_enabled && !require_approval` — as três flags têm que concordar. |
| 5 | **Gate de conversa** (grupo → blocklist → pausa) | `conversa_bloqueada:<motivo>` | Detalhado abaixo. |
| 6 | Cliente pediu humano (regex) | (pausa + handoff) | Respeitar o pedido humano tem prioridade sobre gerar mais IA. |
| 7 | **LOCK por conversa** (timeout 8s) | `lock_indisponivel` / `outra_resposta_em_andamento` | Serializa eventos concorrentes da mesma conversa. Liberado em `finally`. |
| 8 | É a última inbound? | `mensagem_nao_e_a_ultima` | Coalesce de mensagens picadas; quem processa a última responde com contexto completo. |
| 9 | Sem outbound posterior (idempotência) | `ja_respondida` | Retry de webhook / evento duplicado. |
| 10 | Limite diário por conversa (40) | `limite_diario_conversa` | Anti-loop/anti-spam com um cliente. **Fail-closed.** |
| 11 | Limite horário por tenant (120) | `limite_hora_tenant` | Proteção global do provedor. **Fail-open** (ver abaixo). |
| 12 | Pré-check de saúde da conexão | `whatsapp_desconectado` | Não gastar token gerando resposta que não pode ser entregue. |
| 13 | Histórico não vazio (janela 30) | `sem_historico` | Precisa de contexto para responder. |
| 14 | Cliente quer fechar? (regex) | (fechamento determinístico) | Fechamento não pode ser alucinado → sai do LLM. |
| — | *(gera resposta: tier → LLM → sanitiza → follow-through)* | `sem_resposta_segura` / ponte | Ver as outras references. |
| 15 | Re-checa corrida pós-geração | `mensagem_nova_durante_geracao` | O cliente pode ter escrito outra coisa enquanto o modelo gerava. |
| 16 | Envio (`source=ai_agent`, `pause_agent=false`) | — | Falha de envio → notifica dono + devolve texto p/ reenvio. |
| 17 | Atualiza memória durável | — | Funde fatos, marca perguntas feitas, incrementa contador. |

Do passo 7 ao 17 tudo roda **dentro do lock**, liberado sempre no `finally`.

## O gate de conversa (ordem: grupo → blocklist → pausa)

`can_agent_use_conversation(tenant, conversation)` decide se o agente pode agir naquela
conversa, nesta ordem:
1. **Grupo/broadcast → bloqueia.** Grupo não é atendimento 1:1; responder é ruído/risco.
2. **Blocklist → bloqueia.** Contato silenciado pelo dono (ver abaixo).
3. **Pausa → bloqueia**, a menos que a pausa tenha expirado — nesse caso o **auto-resume é
   *lazy*** (acontece na própria checagem, sem cron): se `pause_expired()` e o resume der certo,
   `allowed=true`.

Reuse esse gate: a mesma função alimenta o runtime e o painel.

## Duplo opt-in — por que três flags

O envio automático só sai quando o dono **deliberadamente** colocou o agente em modo autônomo
E sem trava de aprovação. Isso vira a conjunção `mode==='autonomous' && autonomous_enabled &&
!require_approval`.

**Regra de ouro:** o dono edita **um único "modo"** (`off` / `shadow` / `autonomous`); as flags
técnicas são **derivadas no save** (`autonomous_enabled = (mode==='autonomous')`,
`require_approval = !autonomous_enabled`). Assim nunca existe estado "meio ligado" (autônomo com
aprovação pendente = agente mudo mostrando "ligado"). Perfis legados gravados "meio ligados"
precisam ser **salvos de novo** — o painel mostra isso como blocker.

## Fail-open vs fail-closed (decisão consciente de blast radius)

- **Limite por conversa/dia (40) = fail-closed.** Se falhar, protege por padrão.
- **Limite por tenant/hora (120) = FAIL-OPEN.** Se a contagem lançar exceção (erro de infra), o
  catch loga e **retorna 0 — não bloqueia**. Comentário no código: *"Falha de SQL não pode
  silenciar o tenant inteiro; o teto diário por conversa continua valendo."* Um erro numa
  contagem **global** não pode calar o atendimento de **todos** os clientes; o teto por conversa
  segura o dano. Não "conserte" esse catch para fechar.

## Pausas e retomada

- **Pausar** seta `agent_paused=1`, `agent_paused_at=NOW()`, `agent_paused_reason`. Se o motivo é
  `cliente_pediu_humano`/`cliente_quer_fechar`, avisa o dono (dedup diário).
- **Motivos e expiração** (a parte sutil):
  - `human_takeover` — nasce **toda vez que um humano envia manualmente** (todo outbound pausa,
    ver anti-eco). Expira se `resume_hours>0 && decorrido >= resume_hours`.
  - `cliente_pediu_humano` — só expira se `resume_hours>0`, decorrido `>= max(24h, resume_hours)`,
    **E prova no banco de que ninguém da equipe respondeu** desde a pausa (zero outbound sem
    `source=ai_agent` após `paused_at`). Se alguém respondeu, o agente fica quieto.
  - `cliente_quer_fechar` — **NUNCA expira sozinho.** Só a equipe reativa.
- `agent_resume_hours ∈ {0, 12, 24, 48, 72, 168}` (0 = nunca sozinho).
- **Auto-resume é *lazy*:** avaliado só na próxima inbound. Se o cliente nunca mais escreve, a
  conversa permanece pausada na prática, mesmo "vencida".

## Blocklist ("quem o agente não atende")

- Guardada como **JSON no perfil** (`agent_blocklist_json`), não em tabela. Máximo **200**
  entradas `{number, label, added_at}`.
- Match tolera o **nono dígito** brasileiro: dois números com mesmo DDD e mesmos 8 dígitos finais
  são o mesmo (ex.: `55DD9XXXXYYYY` vs `55DDXXXXYYYY`). Generalize para o seu país conforme a
  regra local de numeração.
- **Add/remove tocam SÓ essa coluna** (`INSERT … ON DUPLICATE KEY UPDATE agent_blocklist_json =
  VALUES(...)`), nunca via o save do perfil inteiro. Silenciar um contato é ação isolada e não
  deve reescrever a persona do agente.

## Sanitização de saída (antes de enviar)

`sanitize_reply()`: remove cercas de código e aspas envolventes, **bloqueia vazamento da
estrutura interna** (nomes de campos internos, JSON do contexto, "system prompt"), corta em ~900
chars. Se a limpeza **esvaziar** o texto e o modelo tinha respondido → `sem_resposta_segura`
(silêncio). Texto inseguro nunca vai ao cliente; o silêncio é intencional.

## Rede de segurança sem vácuo

Se toda a cadeia de modelo falhar (nem fallback determinístico serve), envia uma **mensagem-ponte
fixa** ("Recebi sua mensagem! Já te retorno…"), **no máximo 1x a cada 6h por conversa**,
controlada por um timestamp `last_hold_at` na memória durável. Tem anti-corrida (se chegou inbound
mais nova, não envia). O cliente nunca fica sem retorno.

## Checklist portátil de guardas (para qualquer canal, qualquer stack)

Antes de o agente **enviar** qualquer resposta, satisfaça, nesta ordem:

1. Entrada válida (tenant + conversa).
2. Mensagem acionável (texto normalizado; mídia sem texto = silêncio).
3. Canal de saída disponível.
4. Opt-in explícito por conjunção de flags derivadas de **um único modo**.
5. Gate: não-grupo → não-silenciado → não-pausado (com auto-resume *lazy*).
6. Pedido de humano tem prioridade → pausa + handoff + para.
7. Lock por (tenant, conversa), timeout curto, liberar em finally.
8. É a última mensagem do cliente? Senão, desiste.
9. Já existe resposta posterior? Então não responde de novo.
10. Teto por conversa/dia (**fail-closed**).
11. Teto global por hora (**fail-open** — erro de medição não cala todos).
12. Pré-check de entregabilidade **antes** de gastar LLM.
13. Momento crítico (fechamento) sai do LLM → texto determinístico + pausa + tarefa humana.
14. Sanitiza a saída; prefira silêncio a texto inseguro.
15. Rede de segurança sem vácuo (ponte fixa com rate-limit próprio).
16. Re-checa corrida logo antes de enviar.
17. Falha de envio ≠ perda: notifica operador + guarda o texto para reenvio.
18. Marca a própria saída (`source=agent`) e **não** se auto-pausa; adota ecos do provedor.
19. Audita toda decisão (enviado/silenciado + motivo), sem derrubar o fluxo.
20. Memória durável fora da janela (não re-perguntar).

Constantes de volume da referência (sobrescrevíveis): `MAX_REPLIES_PER_CONVERSATION_DAY=40`,
`MAX_REPLIES_PER_TENANT_HOUR=120`, `HISTORY_WINDOW=30`. Fixos no código: lock **8s**, LLM timeout
**20s**/retries **1**, ponte **1x/6h**, adoção de eco **10 min**, eco recente do agente **180s**,
sanitização **900** chars, retenção de decisões **30 dias** (~2% amostrado).
