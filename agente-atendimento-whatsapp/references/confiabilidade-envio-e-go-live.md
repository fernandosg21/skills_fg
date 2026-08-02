# Confiabilidade de envio e go-live

Use esta referência ao implementar envio direto, respostas da IA, mensagens agendadas, retry,
confirmações externas ou ativação do modo autônomo. O objetivo não é apenas evitar duas threads ao
mesmo tempo: é não duplicar uma intenção quando o provedor aceita e o processo falha antes da
confirmação local.

## 1. Invariantes

Para cada mensagem automática, provar:

1. A intenção pertence ao tenant e conversa corretos.
2. A inbound que originou a resposta continua sendo a última acionável.
3. Só existe uma intenção lógica para essa origem.
4. Plano, módulo, perfil, pausa, blocklist, horário e conexão continuam válidos imediatamente antes
   da entrega.
5. Aceite remoto desconhecido não vira reenvio cego.
6. Memória derivada de outbound e auditoria de entrega refletem apenas a fronteira realmente
   confirmada; fatos da inbound autenticada são persistidos independentemente da resposta.

Claims, locks e transações reduzem concorrência, mas **não** garantem exactly-once no intervalo
`provedor aceitou → processo morreu → banco não confirmou`. Resolver esse intervalo com outbox,
chave idempotente e reconciliação.

## 2. Outbox antes do provedor

Gravar a intenção numa outbox antes da chamada externa. Modelo mínimo:

```text
outbox_id, tenant_id, conversation_id, origin_type, origin_id,
idempotency_key, body_ref/body_encrypted, destination_ref,
status, processing_token, attempts, next_attempt_at,
provider_message_id, accepted_at, delivered_at, last_error_fingerprint,
cancel_requested_at, do_not_retry, created_at, updated_at
```

Estados sugeridos:

```text
pending -> claimed -> sending -> accepted -> delivered
                           \-> unknown -> reconciliation -> accepted|delivered|retry|dead_letter
                    \-> retry -> claimed
                    \-> dead_letter
pending/claimed -> cancelled
```

`accepted` só prova que a API recebeu a solicitação; não chame isso de entrega. Defina por adapter a
fronteira que permite avançar o estado conversacional e mantenha a distinção visível em
auditoria/métricas. Falha conclusiva após aceite vira `retry` ou `dead_letter` conforme política,
nunca um estado inventado fora desta máquina.

`cancelled` vale somente antes de `sending`. Opt-out/takeover durante `sending|unknown|accepted`
marca `cancel_requested_at`/`do_not_retry`, tenta cancelamento remoto apenas se o provedor tiver
operação idempotente confiável e sempre reconcilia. Não chame in-flight de cancelado nem reenvie.

- Criar unique key por `(tenant_id, channel_account_id, idempotency_key)`.
- Derivar a chave da intenção, não da request. Incluir conta/canal, tipo da origem, ID da origem,
  revisão deliberada e índice da bolha quando houver. A mesma intenção reutiliza a mesma chave.
- Fazer todos os caminhos de outbound iniciados pelo sistema usarem a mesma outbox.
- Se o provedor oferece idempotency key, enviar a mesma chave. Se não oferece, reconciliar pelo ID
  remoto/eco antes de repetir uma tentativa com resultado desconhecido.
- Nunca usar log de decisões como depósito do texto a reenviar; referenciar a outbox e aplicar a
  retenção apropriada.
- Manter o corpo cifrado ou por referência com TTL. Auditoria guarda apenas ID, hash/fingerprint e
  metadados seguros.
- Levar falhas permanentes a `dead_letter` com ação manual explícita; não tentar para sempre.

## 3. Separar geração de entrega

Não segurar um lock de conversa durante toda a geração da LLM. Isso impede uma inbound nova de ser
persistida/processada e favorece resposta obsoleta.

Usar dois níveis:

1. **Lock de geração por inbound**: `(tenant, inbound_message_id)`. Impede duas gerações para a
   mesma mensagem e permite que a inbound seguinte tenha sua própria execução.
2. **Lease/mutex curto de entrega por conversa**: compartilhado por envio local, processamento do
   webhook/eco e adoção. Serializa a decisão final e o ponto de linearização da entrega.

Contratos:

- Permitir no máximo uma geração lógica por request. Não recursar/coalescer chamando a LLM várias
  vezes quando chega mensagem nova; deixar a nova inbound disparar a próxima execução.
- Antes de gerar, verificar última inbound e dedupe.
- Depois de gerar e antes de entregar, reler settings, entitlement, perfil, conversa, blocklist,
  conexão, última inbound e outbound posterior.
- Adquirir o lock de entrega; repetir a leitura crítica sob a trava.
- Se a inbound deixou de ser a última, descartar a resposta antiga sem enviar.
- Retry manual deve carregar o `message_id` original e recusar se ele não for mais a última inbound.
- Liberar locks sempre em `finally`. Falha em obter o lock de geração/entrega deve impedir o envio,
  não autorizar um caminho paralelo.

### Protocolo canônico de entrega

1. Sob transação curta, validar e criar/obter a outbox `pending`; confirmar a transação.
2. O worker faz claim com fencing token.
3. Adquirir lease/mutex de entrega da conversa com TTL maior que o timeout externo e renovação
   segura. Não manter transação de banco aberta durante a rede.
4. Sob nova transação curta, reler gates, última inbound, outbound posterior e eventos inbound já
   persistidos/pendentes daquela conversa. Se houver backlog/ordem ambígua, cancelar/deferir.
5. Marcar `sending` condicionado ao fencing token; confirmar a transação.
6. Manter somente o mutex de aplicação durante a chamada externa, com timeout curto. Isso define o
   ponto de envio sem bloquear a conversa durante a LLM.
7. Persistir `accepted|delivered|unknown|retry|dead_letter` condicionado ao token e liberar o mutex.
8. Processo morto com `sending`/lease vencido vira `unknown`, nunca retry automático.

Todos os caminhos locais de inbound/outbound usam o mesmo mutex. Mensagem humana enviada fora do
sistema (celular/console do provedor) não pode ser serializada localmente: proíba esse caminho quando
for necessária garantia forte, integre-o como canal oficial ou aceite/documente a janela e pause ao
receber o eco. Não afirme que a outbox cobre ações externas que ela não observa.

## 4. Respostas em bolhas e envio parcial

Se uma resposta for dividida em várias mensagens, crie `response_run_id` pai e uma outbox por parte,
com `part_index`, `parts_total`, ordem e chave idempotente próprias:

- antes de cada parte não entregue, repetir gates, última inbound, takeover/opt-out e mutex;
- enviar em sequência e parar ao primeiro erro ou mudança de estado;
- persistir separadamente `accepted` e `delivered` de cada parte;
- se a terceira falhar, considerar entregues somente a primeira e a segunda;
- atualizar perguntas feitas, preço citado e memória de saída usando apenas partes que alcançaram a
  fronteira de entrega definida pelo adapter;
- registrar `partial_delivery` com contagem e referência da outbox, sem salvar erro bruto.

Fatos extraídos da inbound independem da bolha; `asked`/claims de saída não. Receipt tardio de falha
recalcula/compensa o estado derivado da mensagem em vez de fingir que a parte foi entregue. Não
marcar a resposta inteira como enviada quando apenas parte chegou ao provedor.

## 5. Fila agendada: claim não basta

Para cada rodada:

1. Autenticar dispatcher antes de banco/bootstrap.
2. Adquirir lock curto por tenant/rodada para que HTTP, CLI e heartbeat não concorram.
3. Fazer claim atômico da mensagem com `processing_token` único.
4. Abrir transação e reler com lock de linha a mensagem, tenant/plano, settings/blocklist e conta.
5. Revalidar aprovação operacional, finalidade/base/regra do canal, opt-out/supressão, blocklist,
   modo/pausa, horário, quota, retry, tentativas, token, destino, módulo, entitlement e conexão.
6. Criar/obter a intenção idempotente na outbox.
7. Finalizar estado somente quando o mesmo `processing_token` e estado esperado ainda existirem.

Se a função for chamada dentro de uma transação externa, não executar `begin/commit/rollback` do
chamador. Participar com savepoint próprio e liberar/reverter apenas essa unidade. Colocar qualquer
DDL/`ensureSchema` antes da transação: DDL pode causar commit implícito.

Uma chamada externa longa dentro de transação aumenta contenção e é proibida. Confirme a outbox,
libere a transação e deixe o worker seguir o protocolo canônico de mutex curto + fencing acima.
Quando uma base legada chama o provedor dentro da transação, documente a dívida, limite timeout e
mantenha autonomia bloqueada até migrar.

O dispatcher deve ser worker/fila ou cron autenticado e monitorado. Não executar claim, migração ou
envio em GET de dashboard/listagem. Um heartbeat curto pós-ACK pode ser redundância temporária em
runtime legado, nunca o único mecanismo de liveness.

## 6. Eco e aceite desconhecido

- Marcar toda saída local com `source`, `origin_inbound_id` e `outbox_id` em coluna/metadado mínimo protegido contra
  sobrescrita pelo eco.
- Quando faltar ID remoto, gerar o placeholder uma vez e reutilizá-lo.
- Correlacionar por outbox/client-id/provider-id. Usar conversa+corpo+janela somente como fallback
  com um único candidato; ambiguidade deve ir para revisão sem alterar origem.
- Um eco do agente não pausa a conversa. Um outbound humano posterior pausa.
- Receipt técnico atualiza entrega, mas não é turno, última inbound ou atividade humana.
- Antes de repetir uma entrega com timeout/resultado desconhecido, procurar provider ID, eco ou
  estado remoto. Sem reconciliação, mandar para revisão/dead-letter em vez de duplicar.

## 7. Limites, horário e desconexão

- Centralizar rate limit de todo outbound iniciado localmente por tenant/conta, incluindo agente,
  humano, fila e outras automações. Incorporar eco externo à quota assim que observado e adotar
  margem pessimista quando o provedor não expõe atividade externa em tempo hábil.
- Definir comportamento fail-closed para envio autônomo quando o estado do limiter é desconhecido,
  ou um fallback de volume muito baixo com alerta; nunca deixar a escolha implícita.
- Configurar fuso, dias/horários e mensagem de ausência determinística, sem LLM.
- Fora do horário, enfileirar ou encaminhar conforme política; não responder tardiamente sem
  contexto.
- Processar opt-out antes da LLM; suprimir o destinatário, cancelar `pending|claimed` e marcar
  `sending|unknown|accepted` como `do_not_retry` para reconciliação sem novo envio.
- Ao desconectar, aplicar kill-switch local antes de chamar logout remoto. Mesmo que o provedor
  falhe, o runtime fica desligado.
- Considerar conexão bem-sucedida apenas depois de registrar/verificar webhook seguro. Exibir estado
  distinto para `conectada_sem_webhook`.

## 8. Orçamento global de LLM

- Definir deadline para a resposta inteira; timeout por provedor sozinho pode somar dezenas de
  segundos ao percorrer fallbacks.
- Reservar suborçamentos por tentativa e não iniciar fallback que não caiba no tempo restante.
- Usar circuit breaker por provedor e feature.
- Em tarefas determinísticas/JSON, desligar raciocínio quando o modelo permitir e dimensionar
  `max_tokens` para o pior caso. Em modelos com reasoning, o teto pode cobrir pensamento + resposta.
- Ler `finish_reason`/equivalente; conteúdo truncado ou JSON inválido é falha e deve permitir
  fallback. Só considerar sucesso depois que o conteúdo virar um resultado válido.
- Fazer uma geração lógica por request. Humanização e autoauditoria entram no mesmo prompt, não numa
  segunda chamada cara.

## 9. Matriz de testes sem cliente real

Usar tenant, instância e números controlados. Cobrir:

- inbound simples e webhook duplicado;
- inbound/receipt atrasados, duplicados e fora de ordem;
- duas inbounds durante a geração;
- duas requests para a mesma inbound;
- dois dispatchers concorrentes e lease/fencing token expirado;
- queda depois do aceite remoto e antes da confirmação local;
- timeout com resultado desconhecido;
- eco antes/depois da persistência local;
- resposta em múltiplas bolhas com falha intermediária;
- inbound, takeover ou opt-out entre duas bolhas;
- retry manual de inbound antiga;
- fila pendente, aprovada, cancelada, editada e com downgrade durante o claim;
- chamada agendada dentro de transação externa/savepoint;
- desconexão, reconexão e webhook não registrado;
- mídia grande/MIME falso;
- pausa humana, pedido de humano, blocklist e fora do horário;
- opt-out durante a geração e cancelamento de fila/outbox pendente;
- envio humano fora do sistema e atraso até o eco;
- vazamento de PII/segredo/log e acesso cruzado de tenant.

Não rodar cron, webhook real, QR ou smoke de provedor contra dados de produção sem autorização clara
de envio.

## 10. Go-live gradual

1. Publicar primeiro em `shadow`, sem envio.
2. Antes de observar, definir por escrito volume/amostra mínima, p95/p99 de resposta, deadline LLM,
   SLA e idade máxima de inbox/outbox, heartbeat do dispatcher, tolerância para `unknown`, taxa de
   falha de grounding e gatilhos de rollback.
3. Observar pelo menos sete dias e atingir a amostra definida; tempo ou volume isolado não basta.
4. Exigir zero duplicidade observada, zero acesso cruzado, zero PII/segredo em logs, fila sem vencidos
   inexplicados, webhooks processados e motivos de skip compreendidos.
5. Validar inbound, outbound, eco, retry, mídia, desconexão e concorrência num tenant de teste.
   Shadow prova decisão/intenção, não entrega externa; o ensaio e o canário provam o provedor real.
6. Ativar um tenant piloto com supervisão e rollback para `shadow` em uma ação.
7. Expandir um tenant por vez; nunca ativar todos por migração ou efeito colateral de página.

Não declarar o agente pronto para autonomia ampla enquanto outbox/idempotência, controles reais,
horário, deadline LLM, retenção/privacidade, segredos e ensaio controlado estiverem pendentes.

O ledger de processamento e a outbox são canônicos para recuperação. O log de decisões pode ser
best-effort para observabilidade, mas nunca a única prova de que uma inbound terminou ou de qual
texto deve ser reenviado.
