---
name: build-reliable-llm-router
description: "Implemente ou audite um roteador multi-provedor de LLM com adapters normalizados, fallback por feature, deadline total, cooldown passivo, classificação de falhas, logs por tentativa, JSON validado e degradação determinística. Use quando cadeias OpenAI/Gemini/Groq/Anthropic estão lentas, repetem quota/rate limit, estouram timeout ou precisam continuar funcionando quando a IA falha."
---

# Construir roteador LLM confiável

## Objetivo

Evite que uma feature web gaste todo o request repetindo provedores indisponíveis, sem transformar uma resposta JSON ruim em indisponibilidade global nem deixar a cadeia sem último recurso.

## Mapeie antes de centralizar

1. Liste todos os chamadores, provedores, modelos, formatos, timeouts e fallbacks.
2. Separe chamadas síncronas de web, jobs, cron e webhooks.
3. Identifique fallbacks determinísticos já existentes.
4. Leia [falhas-cooldown-e-deadline.md](references/falhas-cooldown-e-deadline.md).
5. Preserve contratos públicos enquanto migra cada chamador para o router.

## Normalize adapters

- Exponha uma interface comum para texto e JSON estruturado.
- Retorne provider, model, conteúdo, usage, HTTP code, latência e erro normalizado.
- Nunca descarte o status HTTP; ele orienta cooldown e observabilidade.
- Faça adapters apenas traduzirem protocolo; política de cadeia pertence ao router.
- Redija PII antes do adapter quando o provedor não precisar dela.

## Configure cadeias por feature

- Defina ordem e modelos por caso de uso, não uma ordem global cega.
- Estabeleça orçamento de tokens e schema de saída compatíveis com o pior caso real.
- Permita fallback determinístico quando IA não for essencial.
- Faça toda chamada de texto lido por humano usar as regras de estilo aprovadas.
- Não execute IA em carregamento de lista/tela; use ação do usuário ou job controlado.

## Aplique cooldown passivo

- Marque provedor indisponível apenas depois de uma tentativa real falhar.
- Classifique 401/403, 429, 5xx, timeout/conexão, quota, billing, overloaded e saldo insuficiente como indisponibilidade.
- Não aplique cooldown por JSON inválido ou conteúdo fora do schema; o serviço pode estar saudável.
- Use backoff crescente com teto e zere/decresça após sucesso ou janela sem falha.
- Leia o estado por acesso barato; não faça health-check ativo que consome chamada adicional.
- Se o storage de cooldown falhar, degrade sem bloquear a feature.

## Respeite deadline total

1. Receba ou derive `deadline_at` para a cadeia.
2. Antes de cada elo, calcule o tempo restante.
3. Encurte o timeout do elo ao restante disponível.
4. Não inicie outro provedor abaixo de uma reserva mínima para responder ao usuário.
5. Em request web, use retries internos zero; o próprio fallback já é a estratégia.
6. Em jobs, permita retry/backoff separado e persistente.

Tente o último elo viável mesmo em cooldown quando a alternativa for cadeia vazia, mas nunca ultrapasse o deadline.

## Valide JSON e registre tentativas

- Extraia e valide JSON contra schema/contrato explícito.
- Trate truncamento como falha de conteúdo, não como provider down.
- Dimensione `max_tokens` pelo maior resultado esperado e use amostragem/segmentação na entrada.
- Registre uma linha de uso por tentativa, sucesso e falha, com feature/contexto e motivo sanitizado.
- Não deixe falha no log derrubar a resposta.
- Use a skill de medição de uso de IA existente quando o repositório já a tiver.

## Degrade de forma útil

- Para classificação, use regras determinísticas e marque origem.
- Para sugestão, devolva estado indisponível sem impedir a ação manual.
- Para automação, não envie texto vazio nem resposta obsoleta; escale ou refile conforme política.
- Nunca exponha mensagem bruta, prompt, chave ou payload de provedor ao usuário/log.

## Valide

- Simule 401, 429, 500, timeout, quota textual e JSON inválido.
- Prove que JSON inválido não põe o provedor em cooldown.
- Teste cadeia com todos os primeiros elos em cooldown e último recurso disponível.
- Teste deadline curto e confira que o segundo elo não começa tarde demais.
- Teste storage de cooldown ausente e log de uso falhando.
- Teste chamadas simultâneas e atualização monotônica do cooldown.
- Meça latência total e número de tentativas por request.

## Critérios de conclusão

Considere pronto quando o tempo máximo da cadeia é previsível, provedores indisponíveis são evitados sem chamadas extras e toda feature tem uma saída segura quando nenhum modelo responde.
