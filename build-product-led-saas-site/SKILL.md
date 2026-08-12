---
name: build-product-led-saas-site
description: "Implemente ou audite um site público de SaaS orientado por evidências reais do produto, com home, verticais, preços dinâmicos, blog, autenticação, capturas sanitizadas, SEO/social preview, consentimento, performance e design responsivo. Use quando criar ou refatorar landing pages que precisam vender o produto sem inventar telas, preços, métricas ou capacidades."
---

# Construir site público orientado pelo produto

## Objetivo

Faça o marketing demonstrar o software que realmente existe. Use linguagem de benefício ligada a fluxos comprováveis e capturas sanitizadas do produto, mantendo preço, trial e disponibilidade vindos de fontes canônicas.

## Auditar antes de desenhar

1. Liste páginas públicas, autenticação, blog, termos, privacidade e redirects.
2. Identifique audiência, verticais, objeções, proposta de valor e conversões principais.
3. Mapeie catálogo de planos, trial, módulos e bases factuais do produto.
4. Inventarie marca, fontes, capturas e referências visuais aprovadas.
5. Leia [arquitetura-e-evidencias.md](references/arquitetura-e-evidencias.md).
6. Preserve analytics, consentimento, rotas e contratos de signup existentes.

## Construir uma narrativa verificável

- Ligue cada promessa a uma capacidade existente e a uma próxima ação real.
- Organize a página em problema, resultado, evidência do fluxo, prova operacional, preço e CTA.
- Use segmentação por público quando o mesmo produto atende verticais diferentes.
- Não invente depoimento, número de clientes, economia, selo, integração ou disponibilidade.
- Mantenha uma base factual versionada para conteúdo humano e gerado por IA.
- Explique limitações relevantes em vez de escondê-las em copy ambígua.

## Usar produto real como evidência

- Prefira capturas reais sanitizadas a dashboards sintéticos que parecem funcionar.
- Use apenas dados fictícios ou preparados para demonstração.
- Remova nomes, telefones, documentos, valores privados, fotos de clientes, tokens e URLs internas.
- Preserve a geometria da interface; não redesenhe a captura para prometer uma tela inexistente.
- Declare width/height, formato moderno e foco visual responsivo.
- Pré-carregue somente a principal acima da dobra; mantenha as seguintes lazy.
- Versione capturas e permita substituí-las sem alterar a narrativa inteira.

## Criar shell e componentes compartilhados

- Centralize header, navegação, footer, CTA, captura de produto, cards e FAQ.
- Garanta navegação equilibrada mesmo quando logo e CTAs têm larguras diferentes.
- Entregue menu mobile acessível, sem esconder destinos essenciais.
- Use uma fonte de tokens de design e variantes claras/escuras da marca.
- Preserve logo completa no contexto apropriado e contraste WCAG no texto.
- Evite shells independentes por página que derivam em copy, links e consentimento.

## Ler preço e trial da fonte correta

- Use serviço público leve e somente leitura para catálogo ativo.
- Não carregue o billing completo nem faça DDL na home.
- Não mantenha fallback numérico que possa publicar preço antigo.
- Quando a consulta falhar, oculte o número ou mostre estado indisponível honesto.
- Preserve centavos, periodicidade, limites e moeda.
- Faça a página de preços esconder combinações indisponíveis e explicar comparação com fonte real.
- Valide o plano escolhido novamente no checkout.

## Manter continuidade até a ativação

- Propague campanha, segmento e plano escolhido por parâmetros allowlisted ou estado assinado.
- Mantenha cadastro trial mínimo.
- Não peça dados fiscais antes do primeiro pagamento se o produto não precisa deles.
- Use login, recuperação e verificação no mesmo sistema visual, sem mudar seus contratos de segurança.
- Faça CTA apontar para rota real e estado correto, inclusive quando usuário já autenticado.

## Otimizar o caminho crítico

- Use CSS compilado e removido de classes não usadas; não carregue runtime de framework CSS no público.
- Hospede fontes e bibliotecas estáveis localmente quando isso reduzir terceiros e preservar bytes/versões.
- Defina cache imutável para assets versionados e altere a versão a cada troca.
- Evite vídeo pesado, slider automático ou JavaScript antes da evidência principal sem benefício medido.
- Reserve espaço para mídia e fontes para reduzir layout shift.
- Minimize CSS/JS render-blocking e carregue scripts não críticos com defer.
- Teste com cache frio, rede móvel e sem JavaScript para conteúdo essencial.

## Implementar SEO e compartilhamento

- Defina title, description, canonical, robots, Open Graph e Twitter por página.
- Use URLs HTTPS absolutas e imagem social pública com proporção declarada.
- Não coloque PII nem segredo em título, descrição ou imagem.
- Gere sitemap e RSS quando houver conteúdo editorial.
- Use dados estruturados apenas quando representarem conteúdo visível e válido.
- Mantenha páginas privadas noindex/nofollow.

## Respeitar consentimento

- Não carregue GA, GTM, pixels ou embeds de marketing antes da escolha quando a política exigir.
- Envie somente eventos e propriedades sem PII.
- Registre conversão uma vez e preserve atribuição first/last touch conforme contrato.
- Mantenha navegação e signup funcionando quando o usuário recusar ou bloquear trackers.

## Validar

- Compare cada promessa com a fonte do produto.
- Teste preço/trial em sucesso, indisponibilidade e plano desativado.
- Inspecione capturas e metadados por PII.
- Valide navegação, CTAs, formulário e autenticação no desktop/mobile.
- Rode acessibilidade, links, HTML e PageSpeed/Lighthouse proporcionais ao risco.
- Teste consentimento negado sem requests externos.
- Confira cache busting, 404 de assets e layout shift.
- Faça revisão final de acentos e português.

## Critérios de conclusão

Considere pronto quando o site demonstra capacidades reais com ativos seguros, preços e trial vêm da fonte canônica, a jornada até o cadastro permanece coerente e o caminho crítico não depende de terceiros ou scripts pesados desnecessários.
