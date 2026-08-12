# Falhas, cooldown e deadline

## Classificação

| Falha | Cooldown do provedor? |
|---|---:|
| 401/403 credencial | sim |
| 429 rate limit | sim |
| 5xx/overloaded | sim |
| timeout/conexão | sim |
| quota/billing/saldo | sim |
| JSON inválido | não |
| schema incompleto | não |
| recusa de segurança válida | não, trate no produto |

## Estado passivo sugerido

```text
provider
failure_count
cooldown_until
last_failure_class
last_failure_fingerprint
last_success_at
```

Não persista prompt nem resposta bruta nesse estado.

## Backoff de exemplo

`60s -> 300s -> 900s`, com teto e reset depois de uma hora sem falha. Ajuste aos limites reais.

## Deadline

```text
remaining = deadline_at - now
if remaining < response_reserve: stop
call_timeout = min(provider_timeout, remaining - response_reserve)
```

Inclua tempo para serializar, validar, persistir e responder.

## Último elo

Filtre elos em cooldown, mas se todos forem filtrados escolha o último recurso configurado, desde que haja tempo. Isso evita cadeia vazia sem transformar cooldown em bloqueio absoluto.

## Observabilidade

Registre por tentativa:

- feature/contexto;
- provider/model;
- início/duração;
- sucesso;
- HTTP/failure class/fingerprint;
- tokens/custo;
- se foi fallback;
- deadline restante.
