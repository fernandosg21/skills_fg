---
name: manage-freelancer-operations
description: "Implemente ou audite a operação de freelancers e equipes de eventos, cobrindo cadastro multifunção, preços, escala, convites, consulta de disponibilidade, confirmação automática, custos, pagamentos parciais, adiantamentos e estornos. Use quando criar gestão de fotógrafos, cinegrafistas, recreadores ou fornecedores escalados por evento e integrar essa operação à agenda, WhatsApp e financeiro."
---

# Gerenciar operação de freelancers

## Objetivo

Conecte cadastro, disponibilidade, escala, confirmação e acerto financeiro sem perder a identidade da pessoa, a função contratada ou o valor combinado para cada evento.

## Levante o fluxo real

1. Mapeie cadastro, equipe do evento, convites, automações, custos e telas de fechamento.
2. Identifique se o sistema também representa fornecedores e usuários convidados.
3. Localize todas as formas de baixa financeira e seus estornos.
4. Leia [contrato-operacional-financeiro.md](references/contrato-operacional-financeiro.md).
5. Preserve lançamentos e vínculos legados; nunca apague para “simplificar” a migração.

## Modele pessoa, função e escala

- Cadastre a pessoa uma vez e relacione várias funções.
- Guarde contato, dados de pagamento e status dentro do tenant.
- Modele preços por pessoa e função com vigência ou histórico.
- Na escala do evento, grave pessoa, função, papel, horários e o valor combinado como snapshot.
- Não recalcule retroativamente um evento antigo quando o preço padrão mudar.
- Permita membro nominal legado, mas gere uma chave estável e ofereça vinculação posterior.

## Integre disponibilidade e agenda

- Consulte conflitos por intervalo e profissional antes de escalar.
- Modele convite com estado pendente, aceito, recusado, cancelado e expirado.
- Torne aceitação e recusa idempotentes.
- Ao aceitar convite entre contas, crie no máximo um espelho na agenda do convidado e não copie dados privados do cliente.
- Ao remover alguém da equipe, cancele convites e confirmações pendentes e reconcilie o calendário.

## Automatize consulta e confirmação

- Separe consulta de disponibilidade de confirmação de presença; são intenções e estados diferentes.
- Gere um destinatário por membro usando ID quando disponível e chave nominal como fallback.
- Use unicidade por tenant, evento e membro para impedir duplicatas.
- Enfileire mensagens com idempotência e capture respostas mesmo quando um agente de IA não estiver ativo.
- Revalide que a pessoa continua escalada antes de cada envio e lembrete.
- Mantenha link público de resposta funcional quando o módulo interno for desligado, se links já distribuídos precisarem continuar válidos.

## Construa o acerto financeiro

1. Gere um custo por serviço escalado com vencimento, valor original e saldo.
2. Diferencie pagamento do estúdio de pagamento direto do cliente ao profissional.
3. No pagamento do estúdio, exija conta bancária e gere saída de caixa.
4. No pagamento direto, abata o acerto sem movimentar o caixa do estúdio.
5. Aloque pagamentos parciais em ordem determinística e registre cada aplicação.
6. Registre sobra como adiantamento, nunca como valor perdido.
7. Faça o estorno reabrir saldos e caixa de forma atômica e auditável.

Use centavos inteiros ou decimal exato. Nunca calcule dinheiro com ponto flutuante binário.

## Entregue visões complementares

- Mostre resumo por profissional, período, função, pago, pendente, vencido e adiantamento.
- Quando o negócio pedir, ofereça também acerto por evento ou fim de semana; não substitua uma visão pela outra.
- Mostre chave Pix e dados úteis somente a perfis autorizados.
- Permita copiar dados e registrar baixa sem recarregar a página inteira.
- Use modais para confirmações e descreva o efeito do estorno antes de executá-lo.

## Valide ponta a ponta

- Teste uma pessoa com duas funções e preços diferentes.
- Teste mudança de preço depois de evento já escalado.
- Teste convite duplicado, aceite repetido, recusa e remoção da equipe.
- Teste confirmação automática, lembrete e resposta por texto/link.
- Teste pagamento integral, parcial, excedente, direto do cliente e estorno.
- Reconcilie custo, saldo do profissional, conta bancária e DRE antes/depois.
- Teste tenants distintos com o mesmo telefone, e-mail ou nome.
- Confirme que jobs e endpoints validam ownership no backend.

## Critérios de conclusão

Considere pronto quando cada serviço escalado preserva função e preço, cada mensagem tem uma única intenção e todo pagamento ou estorno reconcilia o razão do profissional e o caixa correspondente.
