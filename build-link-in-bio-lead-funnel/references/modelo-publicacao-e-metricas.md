# Modelo de publicação e métricas

## Entidades sugeridas

| Entidade | Responsabilidade |
|---|---|
| bio_profile | tenant, slug, tema e versão publicada |
| bio_draft | configuração editável |
| bio_version | snapshot publicado e autor |
| bio_block | bloco estável, tipo, ordem e estado |
| bio_event | visita/click agregado e sanitizado |
| bio_submission | submissão idempotente e vínculo com lead |

## Tipos de bloco

- link externo com URL validada;
- WhatsApp com número canônico e texto opcional;
- rede social de provedor allowlisted;
- texto curto sanitizado;
- formulário de contato;
- separador visual.

Não aceite HTML/JS livre como tipo genérico.

## Evento analítico mínimo

Campos:

- event_id opaco;
- event_name, como bio_link_click;
- profile_id e block_id opacos;
- session_key rotativa;
- occurred_at;
- campanha com source e medium allowlisted.

Não inclua nome, telefone, e-mail, texto da mensagem ou URL privada.

## Funil

visita válida -> clique -> início do formulário -> envio aceito -> lead persistido

Defina denominadores e deduplicação antes de exibir conversão.

## Publicação

1. Validar todo o rascunho.
2. Gerar snapshot/version.
3. Trocar o ponteiro publicado atomicamente.
4. Invalidar cache pelo número da versão.
5. Registrar auditoria.

Falha antes da troca mantém a versão anterior pública.
