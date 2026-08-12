# Grafo de etapas

## Modelo mínimo

```text
workflow: tenant, event, rules_version, status
step: workflow, key, state, due_at, due_source, completed_at, completed_by
dependency: step, depends_on_step, required
external_link: step, provider, external_type, external_id
```

## Exemplo de capacidades

| Capacidade vendida | Etapas sugeridas |
|---|---|
| fotos digitais | seleção interna -> edição -> galeria publicada |
| reels | edição reels -> entrega reels |
| filme completo | trailer -> filme longo -> entrega de vídeo |
| álbum | seleção -> escolha do cliente -> diagramação -> aprovação -> encadernação -> entrega |

Adapte o grafo ao produto. Não inferir “álbum” apenas pelo nome livre do pacote quando houver item estruturado.

## Regras de reconciliação

- Inserir etapa esperada ausente.
- Não duplicar chave dentro do mesmo fluxo.
- Preservar concluída e seus metadados.
- Preservar prazo manual.
- Desativar etapa removida somente se ainda não iniciada e sem vínculo externo.
- Nunca apagar comentários ou evidências.

## Eventos de domínio úteis

- `event.completed`
- `selection.finalized`
- `gallery.published`
- `album.sent_for_review`
- `album.approved`
- `album.sent_to_vendor`
- `delivery.completed`

Cada consumidor deve processar o mesmo evento mais de uma vez sem duplicar efeitos.
