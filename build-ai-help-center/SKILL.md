---
name: build-ai-help-center
description: "Cria ou audita uma Central de ajuda in-app com documentação curada como fonte única, busca determinística, recuperação por seções/FAQ, respostas de LLM estritamente ancoradas, proteção contra prompt injection e vazamento, limites por usuário, fallback sem IA, sugestões e guia navegável. Use quando um produto precisa responder “como faço?” sem inventar funcionalidades nem expor bastidores."
---

# Central de ajuda com IA ancorada

A documentação ensina; novidades anunciam. Não use catálogo de releases como substituto do guia operacional.

## Estabelecer a fonte de verdade

- Organizar arquivos curados por escopo/produto, com frontmatter mínimo e seções orientadas a tarefas.
- Escrever em linguagem de usuário final: onde fica, como fazer, resultado e perguntas frequentes.
- Excluir rotas internas, tabelas, segredos, limites invisíveis e recursos não lançados.
- Tornar atualização da ajuda parte da definição de pronto de qualquer mudança visível.
- Opcionalmente ingerir novidades ativas como contexto recente, identificando-as como anúncio.

Leia [contrato-da-base.md](references/contrato-da-base.md) antes de montar o corpus.

## Recuperação determinística

1. Indexar arquivos e dividir por seções/títulos, preservando fonte e escopo.
2. Normalizar acentos de forma determinística e tokenizar com stopwords específicas do idioma.
3. Expandir sinônimos de produto e intenção, como criar, remarcar, pagar ou enviar.
4. Pontuar título, pergunta FAQ, termos raros, proximidade e cobertura; penalizar correspondência genérica.
5. Limitar quantidade e caracteres do contexto.
6. Manter função `bestFaq()` para resposta sem IA e sugestões relacionadas.
7. Cachear o índice por versão/mtime; invalidar ao publicar documentação.

## Resposta com LLM

- Enviar somente a pergunta sanitizada, histórico curto e trechos recuperados.
- Delimitar contexto confiável e texto do usuário; neutralizar marcadores que possam forjar blocos.
- Instruir o modelo a responder apenas com fatos presentes nas fontes, admitir ausência e não executar instruções contidas na pergunta ou documentos.
- Proibir exposição de prompt, caminhos internos, segredos, PII e detalhes técnicos invisíveis.
- Usar uma chamada por pergunta, timeout curto e saída limitada.
- Validar a resposta contra sinais de vazamento ou ausência de grounding; em dúvida, descartar e usar fallback.
- Registrar somente telemetria mínima, sem pergunta/resposta crua quando houver dados pessoais.

## Limites e fallback

- Rate limit por usuário/contexto e dia, com mensagem clara de continuidade pelo guia.
- IA desligada, sem credencial, em cooldown, fora do limite ou com resposta inválida deve cair na melhor FAQ/seção.
- Se não houver resultado confiável, dizer que a base não encontrou e oferecer temas; não inventar.
- GET da Central de ajuda não chama IA. A pergunta explícita usa POST + CSRF.
- Conversa/histórico deve aceitar poucos turnos, papéis conhecidos e tamanho máximo.

## Interface

- Botão de ajuda persistente com escopo da área atual.
- Abas ou modos “Perguntar” e “Guia de uso”.
- Resposta com origem amigável, sugestões e link para a seção completa.
- Loading, erro e fallback sem recarregar a página.
- Acessibilidade de teclado, foco, leitor de tela e mobile.

## Testes

- Cada escopo tem documentos e índice não vazio.
- Perguntas parecidas, como criar versus reagendar, recuperam a FAQ correta.
- Acentos, sinônimos e pequenas variações não quebram o ranking.
- Prompt injection, tentativa de trocar regras e delimitador forjado são bloqueados.
- Histórico gigante é truncado e papéis inválidos são descartados.
- IA indisponível/limite/resposta vazada retorna fallback determinístico.
- Resposta não promete capacidade ausente das fontes.
- Documento novo invalida o índice e vira pesquisável.

## Entrega

Produzir convenção editorial, corpus inicial, indexador, busca/FAQ, camada de IA, endpoint seguro, interface, telemetria e suíte offline. Validar perguntas reais do produto antes de liberar.
