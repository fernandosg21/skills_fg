---
name: criar-paginas-de-erro-personalizadas
description: Criar, refatorar ou integrar páginas de erro humanizadas, responsivas e alinhadas à identidade visual de um site, sistema ou aplicativo, com ilustrações separadas do HTML, códigos HTTP reais, acessibilidade, versões desktop/mobile, prévias e pacote pronto para desenvolvimento. Use quando o usuário pedir páginas 401, 403, 404, 408, 410, 413, 422, 429, 500, 502, 503, 504, manutenção, link indisponível, arquivo grande, muitas tentativas, conexão demorada, estado offline ou um kit profissional de error pages. Se a logo oficial e uma referência de identidade visual ainda não estiverem disponíveis, solicite ambas antes de produzir a versão personalizada.
---

# Criar Páginas de Erro Personalizadas

## Objetivo

Transformar erros técnicos em experiências claras, humanas e coerentes com a marca, sem prejudicar acessibilidade, desempenho ou integração com o servidor.

A página deve parecer parte nativa do produto — não uma imagem genérica aplicada por cima do sistema.

## Resultado esperado

Entregar uma ou mais páginas com:

- identidade visual real do projeto;
- mensagem humanizada e ação útil;
- logo, código, título, explicação e botões em HTML;
- ilustração decorativa separada do conteúdo;
- layout responsivo;
- status HTTP correto;
- CSS separado;
- JS somente quando necessário;
- prévias e documentação;
- arquivos adaptados ao stack encontrado.

## Gate obrigatório de identidade

Antes de criar uma versão personalizada, confirme que existem:

1. **Logo oficial** em SVG, PNG ou formato utilizável.
2. **Identidade visual** representada por pelo menos uma fonte:
   - manual de marca;
   - paleta e tipografia;
   - telas aprovadas;
   - site existente;
   - `DESIGN.md`;
   - componentes/tokens;
   - referências enviadas pelo usuário.

Não redesenhe, invente nem peça à geração de imagem para recriar a logo.

Se logo ou identidade estiverem ausentes, faça uma única solicitação:

> Para personalizar as páginas de erro, envie a logo oficial e uma referência da identidade visual — manual, paleta, fontes, telas aprovadas ou link do site. Também informe o repositório/stack e os códigos desejados, caso ainda não estejam no contexto.

Não repita perguntas sobre dados já encontrados na conversa, arquivos, site ou repositório.

Sem identidade suficiente, produza apenas uma versão **neutra e provisória**, claramente identificada como não personalizada.

## Informações a resolver

Obtenha por inspeção ou solicite somente o que faltar:

- nome do projeto;
- logo e identidade;
- URL, repositório ou pasta;
- stack, rotas e estrutura de assets;
- códigos desejados;
- ação principal de cada erro;
- tom: acolhedor, sóbrio, divertido, institucional ou premium;
- escopo: direção, artes, páginas ou integração;
- necessidade de HTML estático para falhas críticas;
- idiomas e i18n.

## Princípios inegociáveis

### Conteúdo funcional fica fora da arte

Mantenha em HTML:

- logo;
- código;
- título;
- explicação;
- botão;
- ação secundária;
- suporte;
- informação técnica opcional.

A arte deve conter fundo, atmosfera e ilustrações decorativas.

Isso permite responsividade, acessibilidade, tradução, manutenção e reaproveitamento.

### Use a logo oficial

Insira a logo como `<img>` ou componente real. Não a incorpore na imagem. Ela deve atuar como assinatura e nunca competir ou sobrepor o código.

### Humanize sem infantilizar

A mensagem deve:

- explicar o ocorrido;
- reduzir incerteza;
- indicar o próximo passo;
- preservar a credibilidade.

Evite culpa, jargão, “erro fatal”, piadas em situações graves e textos longos.

### Responda com o status real

Uma página visualmente 404 que retorna `200 OK` está incorreta. Integre o código real no framework, servidor ou CDN.

### Faça erros críticos resistirem a falhas

Para 500, 502, 503 e 504, prefira:

- HTML/CSS estático ou template mínimo;
- assets locais;
- fontes de fallback;
- nenhuma consulta ao banco;
- nenhuma sessão obrigatória;
- nenhuma dependência externa essencial;
- funcionamento sem JS.

## Conjunto padrão

Quando o usuário pedir um kit sem listar códigos:

- 403 — acesso bloqueado;
- 404 — página não encontrada;
- 410 — link indisponível;
- 413 — arquivo muito grande;
- 422 — dados para revisar;
- 429 — muitas tentativas;
- 500 — problema inesperado;
- 502 — falha entre serviços;
- 503 — manutenção/indisponibilidade;
- 504 — conexão demorada.

Adicione 401, 408 e offline quando forem relevantes.

Use `references/catalogo-de-erros.md` como ponto de partida, adaptando a voz à marca.

## Fluxo obrigatório

### 1. Auditar o projeto

Antes de desenhar:

- abra a página atual;
- identifique framework, rotas, layouts, CSS e assets;
- localize tokens, fontes, iconografia e logo;
- encontre páginas de erro existentes;
- identifique requisitos do servidor;
- preserve padrões de acessibilidade e responsividade.

Se houver URL ou repositório, investigue antes de perguntar.

### 2. Criar o mapa de erros

Para cada código, defina:

- significado técnico;
- percepção humana;
- título;
- explicação;
- ação principal;
- ação secundária, se necessária;
- metáfora visual;
- arte exclusiva ou compartilhada;
- status HTTP;
- dependências permitidas.

Erros relacionados podem compartilhar arte, mantendo código e copy separados. Exemplo: 502 e 504 podem usar a mesma metáfora de conexão.

### 3. Extrair a gramática visual

Mapeie:

- cores;
- contraste;
- fontes;
- proporção da logo;
- bordas e sombras;
- peso de linhas;
- gradientes;
- densidade;
- iconografia;
- motivos recorrentes;
- personalidade;
- elementos a evitar.

Não transfira objetos de outro projeto. Câmera, corda, nuvem ou mascote só entram quando pertencem à marca.

### 4. Definir a direção

Escreva uma direção curta com:

- conceito;
- metáfora;
- composição;
- área segura;
- estilo de traço;
- paleta;
- comportamento mobile;
- nível de humor;
- relação entre as páginas.

Use `references/METAPROMPT.md` para transformar o briefing em instruções executáveis.

### 5. Criar as ilustrações

Regras:

- não gerar textos;
- não gerar código;
- não gerar botão;
- não gerar a logo;
- manter a área funcional livre;
- produzir desktop/mobile quando necessário;
- usar motivos da marca;
- manter traço consistente;
- evitar detalhes que desapareçam no celular;
- tratar a imagem como decorativa.

Prefira SVG construído com formas e paths para ilustrações simples.

Quando usar geração de imagem, entregue PNG/WebP e informe que é raster. Não chame raster de vetor.

### 6. Construir o componente

Estrutura recomendada:

```html
<main class="error-page" data-error-code="404" aria-labelledby="error-title">
  <picture class="error-page__art" aria-hidden="true">
    <source media="(max-width: 47.99rem)" srcset="/assets/errors/mobile/404.svg">
    <img src="/assets/errors/desktop/404.svg" alt="">
  </picture>

  <section class="error-page__content">
    <img class="error-page__logo" src="/assets/brand/logo.svg" alt="Nome da marca">
    <p class="error-page__code">404</p>
    <h1 id="error-title">Esta página não está por aqui.</h1>
    <p class="error-page__message">O endereço pode ter mudado.</p>
    <a class="error-page__button" href="/">Voltar ao início</a>
  </section>
</main>
```

Adapte nomes e componentes ao projeto. Não introduza outro design system sem necessidade.

### 7. Organizar o CSS

O CSS deve:

- ficar separado;
- usar tokens;
- ser mobile first;
- usar `min-height: 100svh`;
- respeitar safe areas;
- controlar camadas com `z-index`;
- limitar a logo com `clamp()`/`max-width`;
- reservar espaço entre logo, código e título;
- impedir sobreposição em 320 px;
- usar tipografia fluida;
- manter alvos de toque confortáveis;
- possuir `:focus-visible`;
- respeitar `prefers-reduced-motion`;
- impedir scroll horizontal;
- funcionar com zoom de 200%.

Não crie HTML separado para desktop/mobile quando CSS responsivo resolver. Separe somente as artes quando a composição exigir.

### 8. Integrar o servidor

Adapte ao stack:

- Laravel: `resources/views/errors/{code}.blade.php`;
- Next.js: `not-found`, `error`, `global-error`;
- React/Vite: fallback de rota e servidor/CDN;
- PHP: `http_response_code()` + template;
- Apache: `ErrorDocument`;
- Nginx: `error_page`;
- estático: páginas por código + configuração da hospedagem.

Para 429, preserve `Retry-After` quando o backend já fornecer.

Para 503 planejado, não prometa horário não confirmado.

### 9. Criar prévias reais

Gere:

- desktop;
- mobile;
- contact sheet quando houver vários códigos;
- demonstração quando útil.

As prévias devem usar o mesmo HTML/CSS da entrega. Não monte uma imagem diferente que esconda sobreposições ou problemas responsivos.

### 10. Validar

Leia `references/qa-e-integracao.md`.

Quando possível, rode:

```bash
python scripts/validate_error_package.py /caminho/do/pacote
```

Corrija erros antes de entregar.

### 11. Empacotar

Para pacote independente, use:

```text
error-pages/
├── README.md
├── manifest.json
├── pages/
├── components/
├── css/
├── js/
├── assets/
│   ├── brand/
│   └── illustrations/
│       ├── desktop/
│       └── mobile/
├── previews/
└── integration/
```

No projeto real, preserve a organização já existente.

## Contrato de copy

Fórmula:

1. o que aconteceu;
2. reassurance sem minimizar;
3. próximo passo.

Limites:

- código: uma linha;
- título: até duas linhas no celular;
- explicação: uma ou duas frases;
- uma ação principal;
- no máximo uma secundária.

Não exiba stack traces, mensagens do banco, IDs sensíveis ou dados internos.

## Regras para a logo

- use o arquivo oficial;
- preserve a proporção;
- mantenha contraste;
- não aplique efeitos estranhos à marca;
- use largura fluida e limite máximo;
- reserve espaçamento independente;
- não coloque sobre o código;
- não incorpore na ilustração.

Ponto de partida:

```css
.error-page__logo {
  width: clamp(8.75rem, 15vw, 13.75rem);
  max-height: 4.5rem;
  object-fit: contain;
}
```

Ajuste à proporção real.

## Acessibilidade

Obrigatório:

- `lang`;
- `meta viewport`;
- um `<main>`;
- um `<h1>`;
- ordem de leitura coerente;
- contraste;
- foco visível;
- alt da logo;
- `alt=""` em arte decorativa;
- links/botões semânticos;
- uso por teclado;
- mensagem compreensível sem a arte;
- nenhuma informação apenas por cor;
- motion reduzido.

Use `noindex, nofollow` nas páginas públicas de erro, salvo decisão contrária documentada.

## Desempenho

- SVG real para formas simples;
- WebP/AVIF/PNG otimizado para raster;
- nada de imagens gigantes;
- nenhuma biblioteca pesada exclusiva;
- fontes existentes ou fallback;
- nenhum JS para conteúdo essencial;
- assets locais nas páginas críticas.

## Checklist de aceite

A entrega só está pronta quando:

- a logo é oficial;
- a identidade corresponde ao projeto;
- não há objetos herdados de outra marca;
- código, título, explicação e botão estão em HTML;
- a arte não contém texto funcional;
- logo e código não se sobrepõem;
- desktop, mobile e 320 px foram verificados;
- o status HTTP é real;
- 500/503 usam dependências mínimas;
- funciona sem JS;
- CSS está separado;
- os assets resolvem;
- há foco visível;
- a prévia reproduz a implementação;
- o pacote/ZIP foi verificado.

## Estratégias de produção

- **Uma arte por erro:** máxima personalidade.
- **Arte por família:** menor manutenção.
- **CSS/SVG:** leve, recolorível e ideal para white-label.
- **Raster autoral:** melhor para linguagem ilustrativa complexa.

Famílias possíveis:

- 401/403 — acesso;
- 404/410 — conteúdo indisponível;
- 408/502/504 — demora/conexão;
- 500/503 — serviço indisponível;
- 413/422 — envio/dados.

## Armadilhas

- gerar a página inteira como imagem;
- prender texto na arte;
- redesenhar a logo;
- usar metáfora sem relação com a marca;
- criar apenas desktop;
- retornar `200 OK`;
- depender do banco no 500;
- usar CDN indispensável;
- usar humor em pagamento/perda de dados;
- esconder a ação;
- criar prévia diferente do HTML;
- chamar PNG de vetor;
- entregar ZIP sem conferir.

## Resposta ao usuário

Informe:

- códigos criados;
- elementos mantidos em HTML;
- artes desktop/mobile;
- formato vetor ou raster;
- integração do status;
- validações executadas;
- links do pacote e prévias.

Se não houve integração direta, diga isso explicitamente.

## Gatilhos

Ative para pedidos como:

- “crie uma página 404 personalizada”;
- “faça telas de erro para meu site”;
- “quero 403, 404 e 500 com a minha identidade”;
- “humanize os erros do sistema”;
- “monte um pacote de error pages”;
- “faça ilustrações para manutenção”;
- “refatore as páginas de erro no Codex”;
- “crie estados de erro profissionais”.
