# Ingestão, anti-eco e despacho agendado

A infraestrutura em volta do agente: receber o webhook sem perder mensagens, gravar de forma
idempotente, distinguir a **própria resposta do agente** (que o provedor devolve como "eco")
de uma intervenção humana, e despachar mensagens agendadas **sem depender de cron**. Referência:
`adm/whatsapp/api/webhook.php`, `adm/whatsapp/backend/processor.php`,
`adm/whatsapp/backend/direct_send.php`, `adm/whatsapp/backend/scheduled_messages.php`.

## Padrão A — ACK rápido de webhook (persist → ACK → processa)

Provedores de webhook **reentregam** se a resposta demora. E o processamento inline pode chamar
IA que passa de 1 minuto. Separe recepção de processamento:

1. **Autentique fail-closed.** Segredo compartilhado **obrigatório**, comparado com comparação de
   tempo constante (`hash_equals`). Sem segredo configurado → **503**, nunca "aberto". (No
   Memora, evento forjado entraria já marcado `signature_valid=1` sem isso.)
2. **Resolva/valide o tenant** com camadas cruzadas (query, nome da instância, conta cadastrada);
   divergência entre camadas → 403; nada resolve → 400.
3. **Persista o evento** normalizado numa tabela, **idempotente por uma chave de entrega**
   (`provider + instância + id_msg + tipo_evento`).
4. **Responda 200 IMEDIATAMENTE** e só então processe. Em runtime síncrono (PHP-FPM/LiteSpeed):
   `ignore_user_abort(true)` + elevar o timeout (ex.: `set_time_limit(180)`), montar o corpo do
   ACK, setar status/headers com `Content-Length` **exato** + `Connection: close`, **drenar todos
   os buffers** (para o Content-Length bater), `echo` e liberar o cliente com
   `fastcgi_finish_request()` (FPM) / `litespeed_finish_request()` (LiteSpeed). **A partir daí
   nenhum echo/header pode ocorrer.** Em runtime async (Node/Go/Python) responda e enfileire
   (worker pool / goroutine / task queue / BackgroundTasks).
5. **Processe inline como best-effort E tenha um worker de reserva** — o inline cobre quando o
   cron não existe. Tudo em try/catch: o processamento **nunca derruba** o webhook (o ACK já foi
   entregue).

## Padrão B — mensagens do próprio agente marcadas na origem

Grave um marcador `source` no payload de **toda** mensagem que o sistema envia: `ai_agent`
(agente) vs `direct_reply` (humano). Três usos:
- **Rate limits do bot** filtram por esse marcador (o teto de 120/h por tenant conta
  `payload LIKE '%"source":"ai_agent"%'`).
- **Painéis** distinguem automático de manual ("clientes atendidos" conta só `ai_agent`).
- **Detecção de eco** (padrões D/E).

E o parâmetro "pausar-o-bot-ao-enviar" deve ser **opt-out para o próprio agente**: envio humano
pausa o bot (human takeover); envio do bot passa `pause_agent=false` — senão a própria resposta
automática desligaria o agente.

## Padrão C — ingestão idempotente com "primeira-gravação-vence" seletivo

Toda mensagem (inbound e outbound) é gravada com upsert, deduplicada pela unique key
`(tenant, provider_message_id)`. A maioria dos campos é "último-não-nulo-vence"
(`COALESCE(novo, antigo)` — o eco pode preencher campos que faltavam). **MAS o campo que carrega
o marcador de origem tem que ser "primeira-gravação-vence"** (`COALESCE(antigo, novo)`):

> **O bug (e o fix).** O envio direto grava a mensagem primeiro com `payload_json` contendo
> `source=ai_agent`. Segundos depois, o **eco** (a mesma mensagem `fromMe` que o WhatsApp
> devolve) chega com o **mesmo id** e cai no `ON DUPLICATE KEY UPDATE`. Se o update fizesse
> `payload_json = VALUES(payload_json)`, o eco (que **não** tem o marcador) sobrescreveria e
> **apagaria `source=ai_agent`** — quebrando o limite de 120/h e o painel de atendidos. Fix:
> `payload_json = COALESCE(payload_json, VALUES(payload_json))` (a primeira gravação vence).

Regra geral: **qualquer metadado que só o emissor local conhece** precisa ser protegido contra
sobrescrita pelo eco.

## Padrão D — reconciliação de eco sem id do provedor

Às vezes o provedor aceita o envio mas **não retorna id**. Grave um **wamid placeholder
determinável** (prefixo reconhecível + hex aleatório, ex.: `evo_<inst>_direct-<hex>`) e uma flag
`provider_id_missing`. **Gere o hex UMA vez e reuse** para payload e chave — regenerar produziria
outro hex e faria payload/wamid divergirem, quebrando a adoção.

Quando o eco chega (com id real, mas que não casa a unique key do placeholder), rode uma
**adoção**: procure um registro outbound recente (mesma conversa, **mesmo corpo normalizado
byte-a-byte**, janela ~10 min, wamid com o prefixo placeholder) e **atualize-o com o id real**,
em vez de inserir duplicata. Trate corrida de unique violation caindo no upsert normal. Sem isso,
o eco entra como outbound "novo" e **pausa o agente por engano**.

## Padrão E — guarda temporal anti-falso-takeover

Antes de tratar um outbound "novo" como intervenção humana, verifique se há um outbound do
**próprio agente** (`source=ai_agent`) com o **mesmo corpo** numa janela curta (**180s**). Se sim,
é eco — **não pause**. Eco de resposta humana (`direct_reply`, sem o marcador) continua pausando.
**Fail-open**: erro na checagem = comportamento conservador (pausa).

> **Comparação de texto tem que ser byte-a-byte.** A adoção (D) e a guarda (E) comparam o corpo
> com a **mesma normalização/truncagem** do envio (normaliza UTF-8 + trunca ~4000). Qualquer
> divergência faz a adoção/guarda falhar silenciosamente e o agente se auto-pausar.

## Padrão F — lock por conversa entre produtor e reconciliador

Um lock nomeado por conversa (`GET_LOCK` no MySQL; advisory lock no Postgres; SETNX/Redlock no
Redis; mutex distribuído) segurado **tanto pelo agente** (durante gerar+enviar+gravar) **quanto
pelo reconciliador de eco** — para o eco **esperar** o registro local existir antes de decidir se
é takeover humano. O lock é **best-effort**: se não adquirir, siga mesmo assim (a mensagem nunca
se perde), apenas aceitando uma decisão possivelmente subótima.

## Padrão G — despacho agendado por claim atômico (cron-independente)

**Nunca dependa só do cron** (pode não estar agendado na hospedagem). Em cada request quente
(webhook, página), tente um **claim atômico de janela** com um UPDATE condicional sobre um
timestamp:

```sql
UPDATE settings SET last_dispatch = NOW()
WHERE tenant_id = ? AND (last_dispatch IS NULL OR last_dispatch <= NOW() - INTERVAL n MINUTE)
```

`rows_affected == 0` significa "outro request já pegou / ainda não é hora" → saia. **Não crie a
linha** (tenant sem settings não configurou o módulo). Nunca lança.

No nível do **item da fila**, repita o padrão: `UPDATE queue SET locked_at=NOW(),
processing_token=<único> WHERE id=? AND status='ready' AND (locked_at IS NULL OR
locked_at<NOW()-timeout)`; só processe se `rows_affected>=1`; **carregue o token por todas as
transições de estado** (envio, falha) para não pisar em processamento concorrente; o lock expira
por tempo (ex.: 10 min). Isso dá *exactly-ish-once* sem broker externo, em qualquer banco
relacional. Equivalentes: `SELECT … FOR UPDATE SKIP LOCKED` (Postgres/MySQL 8), filas gerenciadas
(SQS visibility timeout, Redis BRPOPLPUSH).

## Por que o marcador `source` é load-bearing

Se o eco apagar `source=ai_agent` (o bug do Padrão C), **em cascata**: o contador de 120/h zera
(e o agente ultrapassa o limite), o painel de "clientes atendidos" fica vazio, e a guarda E deixa
de reconhecer o próprio eco (auto-pausa). Todo o Padrão C/D/E existe para manter esse marcador
intacto.
