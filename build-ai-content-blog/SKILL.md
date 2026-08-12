---
name: build-ai-content-blog
description: "Implemente ou audite um blog público com pautas, base de conhecimento curada, geração estruturada por IA, validação, revisão humana autenticada, publicação/agendamento, SEO/GEO, capas, RSS, sitemap, tracking privado e divulgação social. Use quando criar pipeline editorial assistido por LLM sem permitir que a IA invente capacidades do produto ou publique sem aprovação."
---

# Construir blog com conteúdo assistido por IA

## Objetivo

Produza artigos úteis e encontráveis a partir de fontes curadas, com validação determinística e aprovação humana, sem aprovação por token público nem HTML gerado livremente pelo modelo.

## Separe produto, conteúdo e publicação

- Trate o blog institucional como módulo da plataforma, não como dado de tenant, quando esse for o domínio.
- Mantenha pautas, posts, configurações, eventos e links curtos em entidades separadas.
- Faça o LLM criar rascunho estruturado; somente operador autenticado publica.
- Leia [pipeline-editorial-seguro.md](references/pipeline-editorial-seguro.md).
- Reuse a skill de humanização de texto existente quando disponível.

## Construa a base de conhecimento

- Use arquivos versionados por área como única fonte de fatos do produto.
- Mantenha uma fonte editorial separada para dicas gerais.
- Carregue somente documentos em allowlist; nunca aceite caminho livre em endpoint público.
- Selecione contexto por área/pauta e limite tamanho de forma previsível.
- Atualize a base na mesma entrega de qualquer capacidade visível relevante.
- Não permita que a fonte editorial substitua um prompt visual/voz já aprovado.

## Modele pauta e tipos de artigo

- Diferencie conteúdo de produto e editorial.
- Para produto, conecte dor real, história curta e seção explícita de como o produto resolve.
- Para editorial, entregue dica útil e faça menção leve ao produto sem transformar tudo em venda.
- Alterne tipos/tons por contador independente e permita fallback quando não houver pauta do tipo alvo.
- “Gerar agora” de uma pauta específica não precisa consumir a rotação automática.

## Gere JSON estruturado

- Peça título, resumo, abertura, seções H2/H3, listas, FAQ, tags, slug sugerido e CTA em schema definido.
- Injete tom, regras de escrita natural e regras inegociáveis da marca.
- Dimensione entrada/saída para o pior caso e limite a uma chamada por tentativa/provedor.
- Use roteador LLM com fallback e registre uso por tentativa.
- Reconecte ao banco após chamadas longas antes de persistir.
- Nunca aceite HTML arbitrário do modelo.

## Valide e sanitize

- Valide schema, comprimentos, quantidade mínima de seções e campos obrigatórios.
- Faça checagem semântica bloqueante: afirmações de produto precisam ter lastro na base e o artigo deve cumprir o tipo escolhido.
- Aplique regras editoriais duras, como proibição de caracteres/emoji, em prompt, validador e render.
- Faça retry guiado uma vez; se erro bloqueante persistir, troque provedor ou deixe para revisão, nunca publique silenciosamente.
- Renderize JSON para HTML usando allowlist de elementos e escaping por construção.

## Exija revisão autenticada

- Notifique por e-mail apenas com link para o painel autenticado.
- Não crie endpoint público de aprovar/rejeitar por token.
- Faça publicar, rejeitar, arquivar e editar exigirem sessão administrativa e CSRF.
- Mantenha modo leitura que mostra a página final antes de entrar no editor.
- Para geração longa em hospedagem frágil, dispare job e faça polling; não dependa de uma resposta HTTP aberta por minutos.

## Publique com SEO, GEO e segurança

- Gere canonical, Open Graph, Twitter, JSON-LD BlogPosting e FAQ quando aplicável.
- Ofereça RSS, sitemap e `llms.txt` derivados somente de posts publicados.
- Use slug único e redirecionamento seguro por allowlist/ID, nunca URL arbitrária do request.
- Gere capa otimizada com fallback determinístico e cache versionado.
- Relacione artigos por tags e inclua CTA rastreável sem open redirect.

## Meça sem invadir

- Classifique pessoa, crawler social e bot de LLM separadamente.
- Use hash pseudonimizado de visitante; não persista IP cru.
- Registre leitura, CTA, origem/UTM e link curto sem PII.
- Não crie novo tipo de evento quando uma dimensão de origem já resolve a pergunta.
- Mantenha aprovação e analytics fora do caminho crítico do público.

## Divulgue com arte segura

- Gere arte vertical dentro das safe areas da plataforma social.
- Entregue JPEG compatível e link curto próprio sem open redirect.
- Pré-carregue o arquivo antes do gesto de compartilhamento nativo quando a plataforma exigir.
- Faça download ser fallback, não única ação móvel.

## Valide

- Teste pauta de produto/editorial, fila sem tipo alvo e retry de validador.
- Injete afirmação não suportada e prove bloqueio.
- Teste HTML/script no JSON e renderização segura.
- Teste aprovação sem login/CSRF e ausência de rota pública de decisão.
- Teste slug, canonical, RSS, sitemap, JSON-LD e open redirect.
- Teste crawler/visitante e ausência de IP bruto.
- Teste job longo, polling, conexão de banco perdida e fallback de capa.

## Critérios de conclusão

Considere pronto quando todo fato de produto é rastreável a uma fonte curada, nenhuma IA publica sozinha e o HTML público nasce apenas de estruturas validadas e escapadas.
