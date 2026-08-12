---
name: operate-saas-control-plane
description: "Implemente ou audite o painel interno que administra um SaaS multi-tenant: assinantes, trials, ativação, plano override, módulos, cupons, referrals, feedbacks, métricas, impersonação controlada, jobs e ações auditadas. Use quando a equipe operadora precisa gerenciar contas e suporte sem editar banco, confundir override local com cobrança real ou atravessar dados de tenants."
---

# Operar o plano de controle do SaaS

## Objetivo

Construa uma área separada do painel dos tenants, com autorização reforçada, consultas observáveis e mutações explícitas. Toda ação deve mostrar o que muda localmente, no billing e em produtos integrados.

## Separar planos de dados

- Trate o control plane como aplicação operacional distinta do tenant plane.
- Use identidade e papéis próprios para operadores.
- Não reutilize tenant selecionado na sessão como autorização para ação global.
- Faça o operador selecionar a conta alvo explicitamente e revalidá-la em cada request.
- Leia [acoes-e-guardas.md](references/acoes-e-guardas.md).
- Mantenha segredos e rotas internas fora da interface comum.

## Construir visão de assinantes

- Ofereça busca por nome, owner, e-mail, telefone, ID e status com paginação.
- Mostre tenant, proprietário, plano, trial, assinatura, cobrança, módulos, última atividade e alertas.
- Diferencie dado local, espelho do gateway e valor reconciliado.
- Não faça N+1 remoto ao carregar a lista; detalhes externos são sob demanda ou cacheados.
- Redija PII conforme o papel do operador.

## Tratar mutações como comandos

Para cada ação:

1. Exija permissão específica, CSRF e alvo tenant explícito.
2. Gere preview com estado atual, mudança, efeitos externos e riscos.
3. Reautentique ações críticas.
4. Use idempotency key e transação/outbox.
5. Registre reason obrigatório e ticket/contexto quando aplicável.
6. Retorne estado confirmado, parcial ou pendente de reconciliação.
7. Grave auditoria antes/depois sanitizada.

## Distinguir override de billing

- Alterar plan_code local não muda preço cobrado no gateway.
- Mostre claramente override temporário, entitlement efetivo e assinatura financeira.
- Defina expiração/owner do override e alerte divergências.
- Para mudança comercial real, use o fluxo de checkout/proration/webhook.
- Nunca use status da assinatura como código de plano.
- Sincronize produtos acoplados somente pela autoridade definida e com retry.

## Gerenciar trial e ativação

- Permita estender/encerrar trial por comando auditado, sem rebaixar plano pago.
- Ativação manual deve consumir/inutilizar tokens pendentes e preservar identidade.
- Reenvio de verificação não deve criar usuário/tenant novo.
- Bloqueio e reativação usam a mesma máquina de acesso do login real.
- Exija motivo e evite datas incoerentes com timezone.

## Administrar módulos, cupons e referrals

- Reutilize registry central de módulos e gates backend.
- Versione regras de cupom: código, validade, limite, elegibilidade, benefício e uso.
- Reserve/consuma cupom de forma atômica e reconciliável com cobrança.
- Trate indicação e crédito em ledger; operador não edita saldo diretamente sem evento compensatório.
- Mostre pendências e anomalias em vez de corrigi-las silenciosamente.

## Coletar feedback sem misturar suporte

- Mantenha categoria, severidade, status, tenant, autor e histórico.
- Restrinja anexos, redija PII e nunca aceite segredo como texto operacional.
- Converta em ação/ticket por integração idempotente quando necessário.
- Responder ao cliente exige canal e autorização próprios; a tela de feedback não envia automaticamente.

## Expor métricas confiáveis

- Defina eventos, usuários, sessões, contas e conversões antes de criar KPIs.
- Diferencie aquisição do SaaS, uso por tenant e saúde operacional.
- Permita detalhar conta sem transportar seus dados de negócio ao agregado global.
- Mostre latência/frescor e falhas de coleta.
- IA e chamadas externas nunca rodam dentro do laço de assinantes.

## Controlar acesso assistido

Se houver impersonação:

- exija papel privilegiado, motivo, reautenticação e prazo curto;
- use sessão separada com banner persistente;
- bloqueie billing, segredos, exportação e ações destrutivas por padrão;
- registre toda ação com operador e usuário representado;
- ofereça encerramento imediato;
- não reutilize credencial do cliente.

## Operar jobs e incidentes

- Mostre heartbeat, backlog, última execução e erro sanitizado.
- Botão de retry aciona job idempotente; não executa envio/cobrança irrestrita na request.
- Tenha kill switches granulares e auditados.
- Exija confirmação reforçada para reprocessar webhooks, mensagens ou cobranças.
- Não esconda resultado desconhecido; reconcilie antes de repetir.

## Validar

- Operador sem papel acessando URL/API diretamente.
- Tenant trocado no payload entre preview e commit.
- Override de plano sem alterar gateway.
- Mudança comercial via webhook duplicado.
- Ativação repetida e trial pago.
- Cupom concorrente e crédito revertido.
- Impersonação expirada e tentativa de ação bloqueada.
- Métrica com coleta atrasada.
- Toda mutação presente no audit log.

## Critérios de conclusão

Considere pronto quando operadores conseguem resolver rotinas sem SQL manual, cada comando declara seus efeitos e autoridade, divergências são visíveis/reconciliáveis e nenhum acesso global depende apenas de um tenant ID enviado pela interface.
