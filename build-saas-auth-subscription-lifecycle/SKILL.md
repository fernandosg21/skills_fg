---
name: build-saas-auth-subscription-lifecycle
description: "Implementa ou audita o ciclo completo de autenticação e assinatura de um SaaS: cadastro trial mínimo, verificação de e-mail, criação de senha, login por senha e Google/OIDC, recuperação, tenant/admin inicial, coleta fiscal somente no primeiro pagamento, catálogo de planos, checkout, webhooks, trial, carência, inadimplência, cancelamento e reativação. Use quando signup, login, ativação, planos e acesso pago precisam permanecer coerentes de ponta a ponta."
---

# Autenticação e assinatura SaaS

Construa uma máquina de estados explícita. Não trate a página de retorno do checkout, uma flag da UI ou um e-mail enviado como prova de ativação.

## Separar três contratos

1. **Identidade:** usuário, credencial, e-mail verificado, sessões, OAuth e recuperação.
2. **Conta SaaS:** tenant, usuário administrador inicial, perfil e onboarding.
3. **Entitlement:** trial, plano, assinatura, pagamentos, carência, bloqueios e módulos.

Leia [maquina-de-estados.md](references/maquina-de-estados.md) e adapte nomes sem perder as transições.

## Cadastro trial mínimo

- Pedir somente dados necessários para começar. Por padrão: nome, e-mail e telefone/WhatsApp.
- Adiar estúdio, documento fiscal e endereço para o primeiro pagamento, salvo exigência real do produto.
- Validar unicidade de e-mail conforme o modelo de identidade e impedir enumeração nas respostas públicas.
- Criar tenant + admin + perfil + trial em uma transação curta.
- No cadastro manual, gerar token aleatório de uso único, guardar apenas hash/expiração e enviar link para criar senha/verificar.
- Se o e-mail falhar, manter estado coerente e oferecer reenvio; não declarar conta ativa silenciosamente.
- Registrar origem/campanha sem PII em pixels ou logs.

## Login e recuperação

- Usar hash forte de senha, rehash progressivo, sessão segura e `session_regenerate_id`.
- Aplicar rate limit por identidade + origem, resposta genérica e auditoria sanitizada.
- Consumir tokens de recuperação/verificação atomicamente e invalidar os anteriores.
- Centralizar `accessStatus(tenant,user)` e reutilizar no login por senha, OAuth e requests autenticadas.
- Permitir reenvio/ativação administrativa auditada sem rebaixar status pago.

## Google/OIDC server-side

1. Gerar `state` de alta entropia, ligá-lo ao contexto e persistir com expiração.
2. Usar Authorization Code, validar `id_token` (assinatura, audience, issuer, expiração) e exigir `email_verified`.
3. Consumir o state uma única vez; duas abas não devem compartilhar contexto errado.
4. Vincular primeiro por subject estável; fallback por e-mail só quando não houver outro subject ligado.
5. Nunca sobrescrever vínculo conflitante.
6. Conta existente entra pelos mesmos gates do login comum. Conta nova recebe cadastro pré-preenchido e e-mail travado pelo servidor.
7. Não persistir token Google se os escopos de login não exigirem acesso posterior.
8. Manter DDL fora do callback crítico; schema deve estar pronto no deploy.

## Conversão para pago

- Na tela de assinatura, coletar e validar dados completos de billing no backend antes de criar customer/checkout.
- Manter o trial válido mesmo com campos fiscais vazios.
- Persistir intenção/espelho local antes do I/O externo e usar referência externa tenant-scoped.
- Tratar webhook autenticado e idempotente como fonte de verdade; retorno do checkout é apenas orientação.
- Resolver tenant por consenso de customer, subscription, checkout, payment e external reference; ambiguidade falha fechado.
- Centralizar aliases de plano; status de assinatura nunca deve virar código de plano por heurística.
- Separar ambientes e credenciais de produção/sandbox e impedir tenant real em sandbox.

Se a implementação usa Asaas, reutilize a skill `implement-asaas-checkout` para o contrato do gateway.

## Trial, carência e downgrade

- Definir estados monotônicos e uma única função de acesso efetivo.
- Durante carência de inadimplência, manter acesso e mostrar aviso com prazo/ação.
- Bloquear somente após o período definido, salvo risco forte como chargeback.
- Evento negativo isolado não deve rebaixar tenant sem reconciliação do conjunto.
- Se existir plano gratuito pós-trial, usar uma transição canônica que limpe datas e espelhos antigos; não editar somente duas colunas.
- Preservar dados em cancelamento/bloqueio conforme política de retenção; não apagar como efeito do status.

## Testes ponta a ponta

- Cadastro manual, reenvio, token expirado/reutilizado e criação de senha.
- Cadastro/login Google, subject conflitante e state simultâneo em duas abas.
- Login bloqueado, trial ativo, carência, past due, cancelado, lifetime/gratuito.
- Trial aceita dados fiscais vazios; checkout recusa conjunto incompleto e aceita conjunto válido.
- Webhook duplicado converge e retorno do checkout não ativa sozinho.
- Dois sinais de provider apontando tenants diferentes bloqueiam mutação.
- Código legado de plano migra; status gravado por engano vira anomalia, não rebaixamento.
- Recuperação e ativação invalidam tokens concorrentes.

## Entrega

Produzir diagrama de estados, schema/migrações, fluxos de signup/login/OAuth/recuperação, gate de acesso único, integração de billing, telas de correção administrativa, testes e runbook de rollout/rollback.
