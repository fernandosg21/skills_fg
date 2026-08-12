# Modelo de domínio do CRM

Use esta referência para adaptar nomes ao projeto sem colapsar entidades diferentes.

## Entidades mínimas

| Entidade | Responsabilidade | Identidade recomendada |
|---|---|---|
| Lead | Contato captado antes da qualificação | tenant + ID interno; telefone/e-mail como sinais |
| Cliente | Pessoa ou empresa com ficha durável | tenant + ID interno; documento composto por tenant |
| Oportunidade | Negociação no funil | tenant + ID; aponta para lead e/ou cliente |
| Interação | Linha imutável do histórico | tenant + oportunidade + instante |
| Evento | Trabalho reservado ou contratado | tenant + ID; referência explícita ao cliente |
| Origem | Canal de aquisição | chave estável, rótulo apresentável |

## Invariantes

- Um telefone igual em tenants diferentes não representa a mesma pessoa.
- Uma oportunidade pode existir antes de um cliente completo.
- Reserva não compõe receita fechada.
- Uma interação histórica não deve ser reescrita para refletir o estado atual.
- Converter a mesma oportunidade duas vezes não pode criar dois eventos.
- IDs de provedor não autorizam acesso sem confirmar o tenant proprietário.

## Ordem de resolução de identidade

1. Token ou vínculo explícito validado.
2. ID interno com ownership confirmado.
3. Telefone normalizado dentro do tenant.
4. E-mail normalizado dentro do tenant.
5. Sugestão manual de possíveis duplicatas.

Nunca faça merge destrutivo apenas por nome parecido.

## Transições comerciais comuns

`novo -> contato -> orçamento -> negociação -> reserva -> fechado`

Permita saídas para `perdido` e `arquivado`, mas registre o motivo. Adapte as chaves ao domínio existente; não mude chaves persistidas apenas para melhorar o texto da tela.
