---
name: manage-album-production
description: "Implemente ou audite a produção de álbuns e impressões após a venda, cobrindo catálogo de modelos, pedidos manuais ou sincronizados, seleção, aprovação, envio à encadernadora, prazos, custo previsto versus firme, integrações de fornecedor e entrega. Use quando criar quadro de produção, sincronizar Proof, importar pedido de laboratório/encadernadora ou ligar álbum a contas a pagar e fluxo pós-evento."
---

# Gerenciar produção de álbuns

## Objetivo

Acompanhe um álbum desde a seleção até a entrega com uma única identidade de pedido, sem duplicar cards, antecipar dívidas ou permitir que integração externa regrida trabalho já avançado.

## Audite as origens

1. Mapeie eventos, contratos, catálogo de álbuns, projetos de prova, pedidos manuais e integrações de encadernadora.
2. Defina a precedência de vínculo e estado para cada origem.
3. Localize a geração/efetivação do custo financeiro.
4. Leia [estados-vinculos-e-custos.md](references/estados-vinculos-e-custos.md).
5. Preserve pedidos e links existentes durante migração.

## Centralize o catálogo

- Cadastre modelo, tamanho normalizado, quantidade de fotos, custo em centavos, prazo e ativo por tenant.
- Use um único serviço de salvar, buscar e ativar/desativar.
- Não exclua modelos já referenciados; marque fora de linha e continue exibindo nos registros antigos.
- Valide limites reais de coluna e colisões antes de persistir.
- Resolva texto legado por nome exato, dimensão e nome contido; em empate, não adivinhe.

## Modele o pedido e os estados

- Guarde tenant, evento, cliente, projeto de prova, modelo, fornecedor, número externo e origem.
- Preserve snapshots de valor/custo quando a regra financeira exigir congelamento.
- Use estados detalhados internamente e agrupe-os em quatro marcos de interface: seleção, aprovação, encadernação e entrega.
- Trate cancelado separadamente e nunca como etapa concluída.
- Comece o prazo da encadernadora no envio real, não na criação do pedido.

## Faça upsert sem duplicar

Ao sincronizar um projeto de prova, procure nesta ordem:

1. pedido já vinculado ao ID do projeto;
2. pedido compatível do mesmo evento ainda sem outro projeto;
3. novo pedido.

Adote apenas card livre. Se houver dois álbuns no mesmo evento, mantenha dois pedidos. Ao excluir/ignorar um pedido sincronizado, grave tombstone para que sweeps não o ressuscitem.

## Proteja progressão e integrações

- Mapeie estados externos para internos por função única e testada.
- Nunca rebaixe pedido já enviado, pronto, entregue ou cancelado por uma atualização atrasada do Proof.
- Exija sinal confiável, como número de pedido, antes de considerar envio à encadernadora.
- Trate parsing incompleto de fornecedor como desconhecido, não como avanço automático.
- Não aceite custo vindo do fornecedor como autoridade quando o catálogo interno define o custo contratual.
- Torne webhooks, imports e sweeps idempotentes e tenant-scoped.

## Integre o custo financeiro

- Mantenha custo do álbum como previsão enquanto não houver pedido real.
- Efetive quando enviado à encadernadora, marcado como pedido ou pago, conforme regra explícita.
- Carimbe a efetivação e não rebaixe depois.
- Ao efetivar, use data do envio como vencimento e congele valor/data se o compromisso já existe.
- Vincule uma única conta a pagar por pedido/origem.
- Reconcile DRE, provisões e contas a pagar sem somar a previsão duas vezes.

## Construa o quadro operacional

- Ofereça busca por cliente, título, número, modelo e fornecedor.
- Agrupe por marcos com contadores e filtros de estado, fornecedor e origem.
- Mostre uma próxima ação principal e mantenha ações secundárias acessíveis.
- Exponha detalhes de custo, valor, datas, origem do prazo e contato do fornecedor.
- Preserve linhas abertas e filtros após refresh Ajax; adapte pedidos a cards no celular.

## Valide

- Teste pedido manual, de evento e nascido no sistema de prova.
- Teste dois projetos no mesmo evento e sweep repetido.
- Teste exclusão com tombstone e reconciliação posterior.
- Teste todos os estados externos, inclusive desconhecido e atualização atrasada.
- Teste prazo antes/depois do envio e custo previsto/firme/pago.
- Compare conta a pagar, DRE e resultado do evento antes/depois.
- Teste modelo inativo, texto ambíguo e custo ausente.
- Teste dois tenants com mesmo número de pedido externo.

## Critérios de conclusão

Considere pronto quando cada álbum aparece uma vez, o estado só avança por evidência válida e a obrigação financeira nasce no momento de negócio correto com valores reconciliados.
