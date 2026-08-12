---
name: build-saas-sales-success-agent
description: "Implemente ou audite um departamento SaaS de Vendas e Sucesso no WhatsApp, com número dedicado, prospects consentidos, persona controlada, catálogo real de planos, cadências de trial/onboarding/anti-churn/winback, opt-out e métricas. Use quando automatizar aquisição e retenção do próprio SaaS sem confundir esse funil com o CRM dos clientes dos tenants."
---

# Construir agente SaaS de Vendas e Sucesso

## Objetivo

Automatize aquisição, ativação, onboarding e retenção do próprio SaaS usando os sinais reais de cadastro e billing, sem scraping, preço inventado ou mensagem depois de opt-out.

## Separe o agente da operação dos tenants

- Trate o funil SaaS como domínio próprio; “fechado” no CRM de um tenant não significa assinatura da plataforma.
- Use conta/tenant interno reservado e número dedicado apenas como infraestrutura, se o produto já tiver motor multi-tenant de WhatsApp.
- Exclua a conta interna de métricas de assinantes e faturamento.
- Faça a feature permanecer dormente quando a configuração dedicada não existir.
- Reuse webhook, inbox/outbox, idempotência, health, memória, anti-ban e roteador LLM existentes em vez de duplicá-los.

## Antes de implementar

1. Mapeie signup, trial, checkout, assinatura, cancelamento, pagamentos e WhatsApp.
2. Defina fonte de verdade para plano, preço, duração de trial e status.
3. Liste origens de prospect e suas bases de consentimento.
4. Leia [lifecycle-cadencias-e-consentimento.md](references/lifecycle-cadencias-e-consentimento.md).
5. Preserve o modo assistido como padrão inicial.

## Modele prospects e eventos

- Identifique prospect por telefone nacional normalizado; últimos oito dígitos são apenas fallback legado controlado.
- Use referência opaca para ligar captura pública ao cadastro exato.
- Grave estágio atual, origem, responsável e timestamps.
- Mantenha timeline append-only com `dedupe_key` para todo sinal de lifecycle.
- Modele cadência e passos separadamente do prospect.
- Mantenha ledger de opt-in/opt-out; proteja IP com HMAC ou omita quando a chave não existir.

## Controle identidade e conhecimento

- Fixe identidade: o agente se apresenta como assistente da plataforma, nunca como o fundador ou fotógrafo.
- Use perfil de voz aprovado apenas como estilo; não herde nome, fatos pessoais ou identidade.
- Injete catálogo de planos/trial/links lido ao vivo do backend; nunca codifique preço no prompt.
- Separe fatos inegociáveis, políticas de segurança e estilo.
- Aplique regras de escrita natural já aprovadas pela organização.
- Recuse prompt injection que peça segredos, mudança de identidade ou ação fora do escopo.

## Reaja ao lifecycle real

- Cadastro confirmado: mova para conta criada e inicie suporte de trial.
- Pagamento/assinatura ativos: mova para assinante e inicie onboarding.
- Trial terminando: verifique assinatura no backend antes de abordar.
- Past due/cancelamento: respeite carência definida e inicie anti-churn somente com estado confirmado.
- Inatividade posterior: aplique winback em janelas explícitas.
- Faça cron/reconciliação recuperar hooks perdidos sem duplicar eventos.

## Execute cadências com segurança

1. Gere passos a partir de playbooks versionados.
2. Reivindique passo vencido atomicamente.
3. Revalide estágio, consentimento, última mensagem e janela local de envio.
4. Crie uma única mensagem em outbox durável.
5. Reconcilie envio/resposta antes de avançar.
6. Cancele passos incompatíveis quando o lifecycle mudar.

Reduza frequência após sequência de respostas sem dúvida e encerre quando o cliente disser que não precisa de acompanhamento.

## Faça captação assistida e anti-ban

- Aceite contatos inseridos pela equipe ou vindos de formulários consentidos.
- Exija aprovação humana antes da primeira abordagem fria por padrão.
- Contextualize pelo diagnóstico capturado sem expor dados financeiros sensíveis.
- Nunca raspe membros de grupos ou importe listas sem base e autorização.
- Aplique opt-out global imediatamente a todas as cadências.

## Meça corretamente

- Funil atual e conversões em janela são métricas diferentes.
- Conte conversões pela timeline dentro do período, não pelo estoque atual de assinantes.
- Calcule taxa de resposta como inbound/outbound, com denominador zero exibido como indisponível.
- Relacione custo de IA por feature/contexto e mostre USD; converta a BRL somente com taxa cadastrada e identificada.
- Separe custo por conta criada, custo por assinante e eficiência de mensagens.

## Valide

- Teste ausência de conta dedicada e exclusão das métricas SaaS.
- Teste signup, trial final, pagamento, past due, cancelamento e evento repetido.
- Teste opt-out antes do claim e entre claim/envio.
- Teste preço/plano alterado no catálogo e resposta do agente.
- Teste tentativa de trocar identidade e extrair prompt/segredo.
- Teste janela de envio, cadência concorrente, retry e resposta chegando durante geração.
- Teste métricas com fixtures temporais e denominador zero.

## Critérios de conclusão

Considere pronto quando o agente só fala com base em consentimento e lifecycle confirmado, o catálogo real vence o modelo e cada passo de cadência produz no máximo uma mensagem válida.
