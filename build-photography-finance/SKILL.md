---
name: build-photography-finance
description: "Replique, implemente ou audite o sistema financeiro do Memora em outro projeto: contas a pagar e receber, parcelas e descontos, créditos de cliente, caixa e contas bancárias, DRE, recorrências, salários, acertos de equipe, custos de eventos, cobrança e taxas Asaas, retiradas, relatórios e previsão. Use para reproduzir as regras e fluxos financeiros de estúdios, fotografia, vídeo, recreação e eventos em qualquer stack. Billing da assinatura SaaS e contratos jurídicos têm escopo próprio."
---

# Replicar o financeiro do Memora

Entregue paridade de comportamento, cálculos, permissões e estados, adaptada ao projeto alvo. Esta skill contém um retrato auditado em **01/10/2026**, com evidências locais e situação de entrega registrada. Ela não comprova o estado de uma produção futura nem autoriza movimentações reais.

## Escolha o trabalho

| Pedido | Como conduzir |
|---|---|
| Replicação completa | Leia o inventário, as regras de regimes e os contratos das áreas; transforme cada capacidade em requisito verificável no alvo. |
| Correção ou auditoria de um fluxo | Leia os regimes e a referência desse fluxo; rastreie também as superfícies que consomem os valores. |
| Migração de histórico | Reconcilie somente leitura antes; preserve pagamentos, datas, vínculos e origens; prepare dry-run e rollback. |

O nome das tabelas e a linguagem PHP são evidências, não dependências. A replicação pode usar outro banco, framework ou provedor. Preserve o contrato do negócio e registre equivalências e divergências aprovadas.

## Referências por assunto

| Referência | Quando ler |
|---|---|
| [Inventário e fluxos](references/inventario-e-fluxos.md) | Escopo completo, telas, cadastros, integrações, UX e limites de entrega. |
| [Regimes e movimentos](references/regimes-e-movimentos.md) | Qualquer cálculo de caixa, DRE, previsão, saldo, provisão ou cancelamento. |
| [Parcelas, clientes e Asaas](references/parcelas-clientes-e-asaas.md) | Recebimentos, descontos, reagendamento, reserva/sinal, crédito de cliente, links, webhook e taxas. |
| [Equipe, salários e custos](references/equipe-salarios-e-custos.md) | Acertos, pagamento direto ao profissional, créditos/adiantamentos, recorrências, salários e álbum. |
| [Relatórios e previsão](references/relatorios-e-previsao.md) | DRE detalhado, retiradas, análise anual, projeções e fronteira com precificação. |
| [Replicação e validação](references/replicacao-e-validacao.md) | Modelo lógico, APIs, permissões, implementação, cenários de aceitação e migração. |
| [Evidências do Memora](references/evidencias-memora.md) | Localizar fontes auditadas e distinguir entrega registrada, código local e limitações. |

## Comece pelo alvo

1. Mapeie usuários, empresas, fontes de receita, obrigações, pagamentos, bancos, relatórios, automações e provedores existentes.
2. Crie a matriz `capacidade → estado atual → implementação alvo → evidência → teste → divergência`. Use o inventário como checklist; não substitua uma função por um card estático.
3. Defina moeda, arredondamento, calendário/fuso, estados, bases de tempo e ownership. Mapeie entidades antes de copiar consultas ou adaptar componentes.
4. Implemente primeiro as autoridades e aplicações de pagamentos; depois construa os relatórios e as telas sobre essas mesmas fontes.
5. Valide em dados sintéticos, reconcilie histórico em dry-run e informe o que passou, o que depende de integração e o que permanece fora da entrega.

## Contratos que não podem se perder

- **Caixa é realizado.** Recebíveis, previsão de álbum, salário provisionado, desconto e baixa sem caixa não são dinheiro novo. Recebimento original e espelho de contrato nunca entram duas vezes.
- **Parcela não é pagamento.** Preserve a coleção de pagamentos/aplicações e derive o saldo; status isolado e `eventos.valor_pago` não são prova suficiente de entrada financeira.
- **Resultado do período não é saldo bancário.** O saldo acumulado inclui o histórico anterior. Conta desconhecida continua `Sem conta` até identificação; editar a conta não cria novo movimento.
- **Provisão tem recortes.** `previsto=1 AND status=pendente` identifica previsão ativa; ela já pertence às provisões. Efetivar álbum é de mão única. Cancelados nunca reaparecem como abertos.
- **Escopo é financeiro e empresarial.** A empresa, a pessoa e o profissional externo têm ownership próprio. Não exponha caixa, conta Asaas, clientes ou salários de colegas por uma permissão de leitura pessoal.

Na implementação alvo, use centavos inteiros ou decimal exato, validação server-side, transações curtas, locks em ordem estável e chaves de idempotência para retries. São requisitos de implementação robusta; o código legado do Memora também utiliza cálculos `float`, migrações em requests e respostas diferentes por endpoint. Não replique esses detalhes como se fossem funcionalidades.

## Integrações e alterações financeiras

Valide a situação do provedor antes de desconto, crédito, cancelamento ou recriação de parcela quando houver cobrança ativa. Chamada HTTP não deve ficar sob uma transação longa de banco. Para cancelamento do evento, conclua a confirmação do provedor antes da confirmação local; para reagendamento, o Memora salva localmente e retorna avisos de sincronização depois do commit. Modele falhas/reconciliação conforme cada operação.

Asaas de cobrança do cliente do estúdio é separado do billing da assinatura do SaaS. Não copie credenciais, IDs, dados pessoais ou exemplos históricos da produção. Histórico financeiro não pode receber data, banco ou cliente por suposição.

## Conclua por evidência

Execute os cenários de [replicação e validação](references/replicacao-e-validacao.md). O [fixture sintético](assets/cenarios-reconciliacao.json) fornece resultados esperados; [validate_replication.py](scripts/validate_replication.py) compara a saída de um adaptador do projeto alvo com eles. Rodar apenas `--check-fixture` valida o artefato, não implementa nem homologa o alvo.

Uma entrega completa precisa demonstrar: fluxos operáveis; todos os totais reconstruíveis; concorrência sem consumo duplicado; isolamento de tenant/pessoa; histórico e estorno preservados; exportações do filtro inteiro; tratamento de integração indisponível; e divergências de regimes explicadas. Pilotos locais não viram funcionalidades públicas por aparecerem nesta skill.

No fechamento, entregue a matriz de paridade, schema/migrações, APIs e telas, testes com resultados, dependências externas e limitações. Publicar o alvo ou movimentar dados reais depende da autorização desse projeto.
