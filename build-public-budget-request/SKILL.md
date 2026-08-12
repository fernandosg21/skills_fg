---
name: build-public-budget-request
description: "Implemente ou audite links públicos de orçamento baseados em pacotes, com token opaco, desconto assinado, cliente opcional, registro de acesso, captação no CRM e follow-up idempotente. Use quando criar gerador de links de proposta/orçamento para WhatsApp, catálogo público de pacotes, resposta do interessado ou integração entre orçamento público, calendário e funil comercial."
---

# Construir link público de orçamento

## Objetivo

Permita que a equipe escolha um pacote, gere um link seguro e acompanhe a resposta no CRM sem expor IDs previsíveis, aceitar preço adulterado ou criar contatos duplicados.

## Antes de implementar

1. Mapeie catálogo de pacotes, contratos/propostas públicas, CRM, follow-ups e analytics.
2. Identifique se o link é genérico ou personalizado para um cliente.
3. Defina quais valores podem ser alterados pela equipe e quais são calculados no servidor.
4. Leia [fluxo-e-ameacas.md](references/fluxo-e-ameacas.md).
5. Preserve links públicos já enviados durante qualquer migração.

## Modele o pacote e o link

- Escopo o pacote por tenant e use token público opaco, aleatório e globalmente único.
- Não exponha `tenant_id`, ID sequencial ou chave de integração como autorização pública.
- Trate o token como identificador do pacote, não como permissão para editar dados.
- Assine desconto percentual ou valor final com HMAC, incluindo pacote, valor e versão/expiração quando aplicável.
- Recalcule preço e limites no backend; nunca aceite o total enviado pelo navegador como verdade.
- Permita revogar ou rotacionar tokens sem apagar o pacote.

## Construa o gerador interno

- Liste apenas pacotes do tenant e respeite permissões/plano no backend.
- Busque cliente por autocomplete assíncrono e valide ownership do ID escolhido.
- Aceite cliente opcional; sem ele, gere um link genérico sem fabricar pessoa.
- Normalize telefone brasileiro para comparação e envio, preservando DDD e número.
- Mostre preço cheio, desconto e valor final antes de copiar.
- Gere e copie o link sem reload, com feedback inequívoco quando o link foi copiado mas o CRM falhou.

## Construa a experiência pública

- Resolva o tenant exclusivamente pelo token ou vínculo assinado.
- Exiba pacote, itens, preço e chamada para ação com layout móvel primeiro.
- Valide token, assinatura, expiração e consistência do pacote antes de renderizar valores.
- Use preview social com texto genérico, imagem pública absoluta e `noindex,nofollow` quando houver personalização privada.
- Nunca coloque nome, telefone, documento ou detalhes privados na metatag compartilhável.
- Rate-limit respostas e proteja contra CSRF quando houver sessão/cookie relevante.

## Registre a intenção no CRM

1. Receba nome, telefone e contexto mínimo no backend.
2. Valide o pacote novamente pelo token e derive o tenant.
3. Procure cliente/lead dentro do tenant por vínculo explícito e telefone normalizado.
4. Crie ou complemente o contato sem sobrescrever dados melhores por vazios.
5. Reutilize oportunidade aberta compatível.
6. Avance para orçamento enviado somente se o estado atual ainda for anterior; não regrida negociação ou fechamento.
7. Registre interação com pacote, origem e link.
8. Crie no máximo um follow-up equivalente.
9. Emita notificação e métricas depois da transação principal.

## Registre acesso sem confundir com conversão

- Conte geração, abertura, clique e resposta como eventos distintos.
- Deduplicate eventos técnicos repetidos por chave e janela coerentes.
- Não considere cópia do link como venda.
- Relacione métricas a tenant e pacote, minimizando PII.

## Valide

- Tente alterar ID, token, percentual, valor final e tenant na URL e no POST.
- Teste pacote desativado, token revogado e assinatura expirada.
- Teste link genérico e personalizado, cliente existente e telefone novo.
- Reenvie a mesma resposta e prove que CRM, interação e follow-up não duplicam.
- Teste uma oportunidade já em negociação, reserva, fechado e perdido.
- Teste dois tenants com pacote de mesmo nome e cliente de mesmo telefone.
- Confira preview social e ausência de PII no HTML/metadados.
- Teste mobile, teclado, falha de clipboard e erro parcial ao registrar o lead.

## Critérios de conclusão

Considere pronto quando preço e tenant são derivados de dados assinados no servidor, links antigos permanecem válidos conforme a política e cada resposta converge para uma única jornada comercial rastreável.
