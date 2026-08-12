---
name: build-consent-aware-analytics
description: "Implemente ou audite analytics de produto, Google Analytics, GTM e pixels de marketing condicionados a consentimento, com carregadores centrais, eventos sem PII, conversões idempotentes e separação entre áreas públicas e autenticadas. Use quando instrumentar PageView, cadastro concluído, funil, UTM, dataLayer, GA4, Meta Pixel ou banner LGPD sem disparar rede antes da escolha."
---

# Construir analytics com consentimento

## Objetivo

Meça aquisição e uso sem carregar trackers antes da escolha do visitante, misturar propriedades incompatíveis ou enviar PII para plataformas de analytics/marketing.

## Defina o plano de eventos

1. Liste perguntas de negócio, eventos, propriedades, gatilhos e destinos.
2. Classifique cada destino como necessário, analytics ou marketing.
3. Separe site público, aquisição, painel autenticado e produto interno quando suas finalidades/propriedades diferirem.
4. Leia [matriz-de-consentimento.md](references/matriz-de-consentimento.md).
5. Verifique requisitos legais atuais e a política de privacidade antes de ativar terceiros.

## Centralize carregadores

- Crie um único include/componente por provedor.
- Faça páginas rastreáveis importar o carregador; nunca copie snippets em cada arquivo.
- Não injete script, pixel, iframe ou preconnect antes do consentimento correspondente.
- Omita fallbacks `<noscript>` que fariam request sem consentimento.
- Versione IDs/propriedades por ambiente e mantenha segredos fora do cliente.

## Modele consentimento granular

- Guarde preferências separadas para analytics e marketing.
- Compartilhe a escolha entre hosts somente quando a política e o domínio permitirem, com atributos Secure/SameSite/Domain adequados.
- Emita evento local de mudança para carregadores reagirem.
- Antes de iniciar GTM, empurre as flags granulares ao `dataLayer`.
- Condicione cada tag dentro do container à categoria correta; aceitar analytics não autoriza anúncio.
- Se revogar não puder descarregar script já executado, interrompa novos eventos e aplique bloqueio completo na próxima navegação; explique essa limitação.

## Evite duplicidade

- Não configure a mesma propriedade GA4 por gtag direto e GTM simultaneamente.
- Não conte crawler/social preview como pessoa quando a métrica exigir humano.
- Gere um `event_id` opaco para conversões que possam chegar por mais de um caminho.
- Consuma evento de conversão uma única vez após sucesso real do backend.
- Diferencie PageView, início de cadastro e cadastro concluído.

## Nunca envie PII

- Proíba nome, e-mail, telefone, CPF/CNPJ, endereço, tenant/user ID bruto e payload financeiro.
- Use chaves de evento opacas e propriedades categóricas mínimas.
- Não envie custos, preço atual, resultado de diagnóstico ou valor de contrato a pixels sem desenho jurídico/negócio explícito.
- Revise URLs, títulos e query strings para que trackers não capturem tokens/PII.
- Aplique allowlist de propriedades por evento no código.

## Construa analytics próprio quando necessário

- Para eventos operacionais autenticados, use coleta first-party tenant/user-scoped com acesso restrito.
- Separe telemetria necessária à segurança/operação de tracking opcional de comportamento.
- Minimize retenção e identidades; documente finalidade e purge.
- Faça coleta falhar aberta para a feature, mas não silencie falhas de qualidade no painel de observabilidade.

## Instrumente conversões corretamente

1. Backend confirma a operação de negócio.
2. Cria event ID aleatório sem PII e marca pendente na sessão/ledger.
3. Primeira resposta HTML elegível verifica consentimento do destino.
4. Dispara o evento uma vez.
5. Marca consumido independentemente de refresh subsequente.

Cubra fluxos alternativos, como OAuth que cai direto no painel, sem carregar o tracker em toda área privada.

## Valide na rede

- Antes de consentir, prove zero requests aos domínios de tracking.
- Aceite apenas analytics e confirme que marketing não carrega.
- Aceite apenas marketing e confira regras definidas.
- Revogue e teste navegação seguinte.
- Teste cookie entre host raiz, `www` e subdomínios autorizados.
- Teste cadastro manual/OAuth, refresh e conversão duplicada.
- Inspecione payloads e URLs por PII.
- Teste ausência de `<noscript>` e duplicidade de GA4.
- Automatize smoke que verifica cobertura dos carregadores centrais.

## Critérios de conclusão

Considere pronto quando nenhuma requisição de terceiro antecede consentimento, toda conversão nasce de sucesso backend e uma inspeção de payload confirma ausência de PII e duplicidade.
