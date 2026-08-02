# Ingestão, anti-eco e despacho agendado

A infraestrutura em volta do agente: receber o webhook sem perder mensagens, gravar de forma
idempotente, distinguir a **própria resposta do agente** (que o provedor devolve como "eco")
de uma intervenção humana, e despachar mensagens agendadas com worker monitorado e recuperação.
Referência histórica:
`adm/whatsapp/api/webhook.php`, `adm/whatsapp/backend/processor.php`,
`adm/whatsapp/backend/direct_send.php`, `adm/whatsapp/backend/scheduled_messages.php`.

## Padrão A — ACK rápido de webhook (persist → ACK → processa)

Provedores de webhook **reentregam** se a resposta demora. E o processamento inline pode chamar
IA que passa de 1 minuto. Separe recepção de processamento:

1. **Limite o corpo antes do parse.** Validar `Content-Length` e bytes realmente lidos contra um
   teto configurável com clamp defensivo. Payload grande não pode chegar a JSON/PDO.
2. **Autentique fail-closed antes do banco de negócio/schema.** Use somente o resolvedor mínimo de
   segredo pré-banco; segredo/HMAC é obrigatório e a comparação ocorre em
   tempo constante. Meta assina o corpo bruto; Evolution deve usar segredo por instância. Sem
   segredo configurado → **503**, nunca "aberto".
3. **Resolva/valide o tenant** com camadas cruzadas (rota, nome da instância, conta cadastrada);
   divergência entre camadas → 403; nada resolve → 400.
4. **Persista o evento** normalizado numa tabela, idempotente por uma chave de entrega. Sem ID do
   provedor, usar hash do corpo bruto completo no namespace provedor+instância, não um recorte.
5. **Responda 200 e processe exatamente o `event_id` persistido.** Em runtime síncrono
   (PHP-FPM/LiteSpeed):
   `ignore_user_abort(true)` + elevar o timeout (ex.: `set_time_limit(180)`), montar o corpo do
   ACK, setar status/headers com `Content-Length` **exato** + `Connection: close`, **drenar todos
   os buffers** (para o Content-Length bater), `echo` e liberar o cliente com
   `fastcgi_finish_request()` (FPM) / `litespeed_finish_request()` (LiteSpeed). **A partir daí
   nenhum echo/header pode ocorrer.** Em runtime async (Node/Go/Python) responda e enfileire
   (worker pool / goroutine / task queue / BackgroundTasks).
6. **Tenha um worker de reserva** que seleciona apenas eventos pendentes/retry elegíveis, com lock
   por evento e recheck sob a trava. Limitar o trabalho por request para não transformar webhook
   em varredura de backlog. Tudo em try/catch: processamento nunca altera o ACK já entregue.
7. **Minimize retenção.** Persistir envelope bruto só quando a política opt-in autorizar; caso
   contrário, apagá-lo depois do processamento. Não copiar o envelope inteiro para cada mensagem.

## Padrão B — mensagens do próprio agente marcadas na origem

Grave um marcador `source` em coluna própria e atribuída pelo servidor em **toda** mensagem:
`customer`, `agent`, `human`, `human_external`, `scheduled`, `campaign`, `system` ou
`provider_echo`. Guarde também
`origin_inbound_id` e `outbox_id`. Três usos:
- **Rate limits** somam todas as origens de outbound, com cortes adicionais por origem.
- **Painéis** distinguem automático, manual, agendado e eco.
- **Detecção de eco** (padrões D/E).

E o parâmetro "pausar-o-bot-ao-enviar" deve ser **opt-out para o próprio agente**: envio humano
pausa o bot (human takeover); envio do bot passa `pause_agent=false` — senão a própria resposta
automática desligaria o agente.

## Padrão C — ingestão idempotente com "primeira-gravação-vence" seletivo

Toda mensagem (inbound e outbound) é gravada com upsert, deduplicada pela unique key
`(tenant, provider, channel_account_id, provider_message_id)`. A maioria dos campos é "último-não-nulo-vence"
(`COALESCE(novo, antigo)` — o eco pode preencher campos que faltavam). **MAS o campo que carrega
o marcador de origem tem que ser "primeira-gravação-vence"** (`COALESCE(antigo, novo)`):

> **O bug (e o fix).** Num schema legado, o envio direto gravava `source=ai_agent` dentro de
> `payload_json`. Segundos depois, o eco chegava com o mesmo ID e um payload sem o marcador. Um
> update irrestrito apagava `source`, quebrando limite, painel e anti-eco. A correção portátil é
> ter coluna própria; no legado, preservar a primeira gravação local:
> `source = COALESCE(source, novo_source)` (a primeira gravação local vence). Em schema legado
> onde `source` ainda vive em JSON, preservar apenas esse metadado; não manter a resposta/payload
> bruto do provedor.

Regra geral: **qualquer metadado que só o emissor local conhece** precisa ser protegido contra
sobrescrita pelo eco.

“Primeira gravação vence” é assimétrica: se o eco chegou primeiro como `provider_echo`, uma
correlação autenticada com outbox/client key pode promover para a origem local allowlisted registrada
na outbox (`agent|human|scheduled|campaign|system`). `human` promove e pausa a conversa.
O inverso é proibido: payload/eco nunca rebaixa uma origem local já comprovada. Faça a promoção sob
lock e unique, não por texto ambíguo.

## Padrão D — reconciliação de eco sem id do provedor

Às vezes o provedor aceita o envio mas **não retorna id**. Grave um **wamid placeholder
determinável** (prefixo reconhecível + hex aleatório, ex.: `evo_<inst>_direct-<hex>`) e uma flag
`provider_id_missing`. **Gere o hex UMA vez e reuse** para payload e chave — regenerar produziria
outro hex e faria payload/wamid divergirem, quebrando a adoção.

Quando o eco chega, reconcilie primeiro por `outbox_id`, client/idempotency key e ID remoto. Somente
como fallback procure registro outbound recente da mesma conversa e mesmo corpo normalizado. O
fallback textual só pode adotar quando houver **um único candidato inequívoco**; dois “Olá” iguais
na janela tornam o resultado ambíguo e devem gerar defer/revisão, nunca atualização destrutiva.

## Padrão E — guarda temporal anti-falso-takeover

Antes de tratar um outbound "novo" como intervenção humana, procure correlação inequívoca com a
outbox e a origem local. Matching por texto/janela é último recurso e só vale com um candidato.
Eco do agente não pausa; envio humano confirmado pausa. Em erro/ambiguidade, deferir e alertar em
vez de classificar silenciosamente como humano ou agente.

Um outbound desconhecido nasce transitoriamente `provider_echo`. Tente correlação por um intervalo
limitado; sem candidato local e com sinal confiável de mensagem enviada pela própria conta,
promova para `human_external`, contabilize na quota e pause. Com múltiplos candidatos, mantenha hold
e revisão; não adote uma origem automática por palpite. Se o provedor não oferece sinal confiável,
use a postura conservadora (pausa/revisão) ou mantenha autonomia bloqueada para contas com envio
externo permitido.

> **Comparação de texto tem que ser byte-a-byte.** A adoção (D) e a guarda (E) comparam o corpo
> com a **mesma normalização/truncagem** do envio (normaliza UTF-8 + trunca ~4000). Qualquer
> divergência faz a adoção/guarda falhar silenciosamente e o agente se auto-pausar.

## Padrão F — lock por inbound para gerar, lock por conversa para entregar

Não segure a conversa durante a chamada LLM. Use:

- lock de geração por `(tenant, inbound_id)`, impedindo duas gerações para a mesma inbound;
- lock curto de entrega por `(tenant, conversation_id)`, compartilhado por envio, insert do
  webhook/eco e adoção.

Ao obter o lock de entrega, reler última inbound, outbound posterior, perfil, plano, módulo, pausa,
blocklist, horário e conexão. Se o lock não estiver disponível, **não enviar fora dele**; deixar o
evento/intenção pendente para retry. A ingestão pode persistir sem lock para não perder mensagem,
mas entrega/adoção deve falhar fechada ou ser adiada.

## Padrão G — dispatcher monitorado, claim e gate fresco da fila

Use worker/fila ou cron autenticado como mecanismo principal de liveness, com métrica de atraso e
alarme. Não processe fila em GET de dashboard/listagem. Em runtime legado, um heartbeat pós-ACK
curto e limitado pode ser redundância temporária, mas não substitui scheduler monitorado.

O dispatcher adquire um **claim atômico de janela** com update condicional sobre timestamp:

```sql
UPDATE settings SET last_dispatch = NOW()
WHERE tenant_id = ? AND (last_dispatch IS NULL OR last_dispatch <= NOW() - INTERVAL n MINUTE)
```

`rows_affected == 0` significa "outro dispatcher já pegou / ainda não é hora" → saia. **Não crie a
linha** para tenant sem módulo configurado.

No nível do **item da fila**, repita o padrão: `UPDATE queue SET locked_at=NOW(),
processing_token=<único> WHERE id=? AND status='ready' AND (locked_at IS NULL OR
locked_at<NOW()-timeout)`; só processe se `rows_affected>=1`; **carregue o token por todas as
transições de estado** para não pisar em processamento concorrente.

Isso evita dois workers locais tratarem a mesma linha, mas **não** fecha a janela entre aceite do
provedor e confirmação no banco. Para cada item reclamado:

1. usar lock de rodada por tenant, compartilhado por HTTP/CLI/heartbeat;
2. abrir transação e reler com `FOR UPDATE` mensagem, plano/tenant, settings/blocklist e conta;
3. revalidar aprovação operacional, finalidade/base/regra do canal, opt-out/supressão, blocklist,
   modo/pausa, horário, quota, token, tentativas, destino, entitlement, módulo e conexão;
4. criar/obter uma outbox idempotente antes da chamada externa;
5. finalizar somente se o mesmo `processing_token` e estado esperado continuarem válidos;
6. enviar falha permanente para dead-letter.

Quando a função for chamada dentro de transação externa, usar savepoint local e nunca executar
commit/rollback do chamador. Rodar todo `ensureSchema` antes de qualquer transação. Ver
[confiabilidade-envio-e-go-live.md](confiabilidade-envio-e-go-live.md).

Equivalentes de claim: `SELECT … FOR UPDATE SKIP LOCKED` (Postgres/MySQL 8), SQS visibility
timeout ou Redis BRPOPLPUSH. Nenhum deles, sozinho, torna o I/O externo exatamente-uma-vez.

## Padrão H — receipt técnico não é conversa

Persistir entrega/leitura/falha do provedor em entidade/evento técnico ligado à mensagem/outbox.
Receipt pode promover `accepted` para `delivered` ou classificar falha conclusiva em `retry`/
`dead_letter` conforme política, mas não cria turno, não dispara LLM,
não altera a última inbound e não conta como atividade humana. Deduplique e tolere atraso, repetição
e ordem invertida.

## Padrão I — eventos fora de ordem

Declare no `ChannelAdapter` se existe sequence number confiável e qual é o escopo. Com sequência,
avance o high-water mark monotonicamente e não permita que evento atrasado mova a última inbound para
trás. Sem sequência confiável, timestamp do provedor é apenas indício: bufferize uma janela curta ou
coloque eventos próximos/ambíguos em hold conservador. Antes de enviar, considere eventos inbound já
persistidos mas ainda não processados para a mesma conta/conversa; não responda por cima de backlog
conhecido. Teste duplicatas, atraso e ordem invertida.

## Por que o marcador `source` é load-bearing

Se o eco apagar `source=agent` (o bug do Padrão C), **em cascata**: a quota fica incorreta,
o painel de "clientes atendidos" fica vazio, e a guarda E deixa
de reconhecer o próprio eco (auto-pausa). Todo o Padrão C/D/E existe para manter esse marcador
intacto.
