# Modelo e triagem de feedback

## Entidades

| Entidade | Responsabilidade |
|---|---|
| feedback | Relato, categoria, impacto e estado |
| feedback_occurrence | Ocorrência/autor por tenant |
| feedback_attachment | Metadado e objeto privado |
| feedback_history | Transições e notas |
| feedback_external_link | Issue/ticket idempotente |
| feedback_response | Comunicação autorizada ao usuário |

## Campos recomendados

- feedback_id opaco;
- tenant_id e user_id resolvidos no servidor;
- category_key;
- description sanitizada;
- impact_key;
- app_version e route_key allowlisted;
- browser_family e viewport;
- submission_nonce;
- fingerprint opcional;
- status, severity e priority separados;
- assigned_to;
- created_at, triaged_at, resolved_at.

## Classificação

Categoria:

- bug;
- sugestão;
- dúvida/usabilidade;
- elogio;
- outro.

Impacto informado:

- bloqueia trabalho;
- atrapalha;
- melhoria desejada;
- comentário.

Severidade técnica:

- S1 risco/indisponibilidade ampla;
- S2 função principal quebrada;
- S3 erro com contorno;
- S4 cosmético/baixa urgência.

Não aceite severidade do usuário como decisão final.

## Estados

received -> triaged -> investigating -> planned ou fixing -> resolved

Saídas: needs_info, duplicate, declined e reopened.

## Retenção

- relato textual conforme política de produto;
- contexto técnico enquanto útil;
- anexos por período menor;
- links externos enquanto o ticket existir;
- PII incidental redigida ou removida;
- exportação/exclusão tenant-scoped conforme obrigações.

## Integração externa

Use chave feedback_id + destination. Grave external_id antes de permitir novo retry. Se o resultado do provider for desconhecido, pesquise/reconcilie antes de criar outra issue.
