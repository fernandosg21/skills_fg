# Algoritmo de busca local para o chatbot (sem IA)

Como construir um chatbot que responde dúvidas usando apenas as FAQs do guia em markdown — sem dependência externa, sem custo, sem latência de rede.

## Princípio

O chatbot é um **buscador**, não um gerador. Não cria respostas: encontra a FAQ mais próxima da pergunta do usuário no markdown e exibe a resposta cadastrada.

Isso funciona porque:
- A maioria das dúvidas dos usuários é repetitiva e previsível.
- 25-30 FAQs cobrem ~85% dos tickets de suporte em produtos SaaS bem documentados.
- Quando o match falha, o fallback é honesto ("Não encontrei resposta direta") + sugestões.
- O custo marginal de adicionar uma pergunta nova é trivial (editar o markdown).

## Pipeline

```
"Como cadastro um paciente?"
        │
        ▼
[1] Normalize    → "como cadastro um paciente"  (lower + remove acentos + pontuação)
        │
        ▼
[2] Tokenize     → ["como", "cadastro", "um", "paciente"]
        │
        ▼
[3] Remove stop  → ["cadastro", "paciente"]  (stopwords pt-BR removidas)
        │
        ▼
[4] Score        → para cada FAQ, calcular score baseado em overlap
        │
        ▼
[5] Rank         → ordenar por score decrescente
        │
        ▼
[6] Threshold    → se score > 0, retornar top 1 como resposta + top 2-3 como relacionadas
                   se score == 0, fallback "Não encontrei" + 3 perguntas mais comuns
```

## Etapa 1 — Normalização

Objetivo: tornar "Cadastro de Paciente", "cadastro paciente", "Cómo cadastro paciente?" todos equivalentes.

Operações:
1. `toLowerCase()`.
2. `normalize('NFD')` + remover combining marks: `replace(/[̀-ͯ]/g, '')`. Remove acentos.
3. Remover pontuação: `replace(/[^\p{L}\p{N}\s]/gu, ' ')`.
4. Colapsar espaços: `replace(/\s+/g, ' ').trim()`.

### TypeScript
```ts
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

### Python
```python
import unicodedata
import re

def normalize(text: str) -> str:
    text = text.lower()
    text = ''.join(c for c in unicodedata.normalize('NFD', text)
                   if unicodedata.category(c) != 'Mn')
    text = re.sub(r'[^\w\s]', ' ', text, flags=re.UNICODE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text
```

### Ruby
```ruby
def normalize(text)
  text.downcase
      .unicode_normalize(:nfd)
      .gsub(/\p{Mn}/, '')
      .gsub(/[^\p{L}\p{N}\s]/, ' ')
      .gsub(/\s+/, ' ')
      .strip
end
```

## Etapa 2 — Tokenização

Splita por espaço e filtra tokens curtos.

```ts
function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}
```

**Importante**: tokens de 1 caractere quase nunca contribuem positivamente — filtre. Tokens de 2 caracteres podem ser úteis (ex: "ok", "id").

## Etapa 3 — Stopwords

Tokens muito comuns que não diferenciam consultas. Use uma lista enxuta para o idioma do produto:

### Português
```ts
const STOPWORDS_PT = new Set([
  'o','a','os','as','um','uma','uns','umas',
  'de','do','da','dos','das','para','com','em','no','na','nos','nas',
  'e','ou','que','se','mas','quando','onde','qual','quais',
  'meu','minha','meus','minhas','seu','sua','seus','suas',
  'é','são','ser','estar','tem','ter','tinha','foi',
  'por','pelo','pela','pelos','pelas','ao','aos','à','às',
  'isso','isto','aquele','aquela','aqui','ali','assim',
  'mais','menos','muito','pouco','já','também','só','apenas',
  'como','onde','quando','quem','porque','porquê'
]);
```

### Inglês
```ts
const STOPWORDS_EN = new Set([
  'a','an','the','and','or','but','if','of','in','on','at','to','for','with',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'i','you','he','she','it','we','they','this','that','these','those',
  'my','your','his','her','its','our','their','what','which','who','how','where','when'
]);
```

### Espanhol
```ts
const STOPWORDS_ES = new Set([
  'el','la','los','las','un','una','unos','unas',
  'de','del','en','con','por','para','a','al','y','o','que','se',
  'mi','tu','su','este','esta','esto','estos','estas',
  'como','cuando','donde','quien','cual','cuales','por','que'
]);
```

Escolha a lista pelo idioma do `ONBOARDING.md`. Para apps multilíngues, concatene as listas (a inflação de stopwords não atrapalha — só ignora ainda mais ruído).

## Etapa 4 — Indexação das FAQs

Parser do markdown. Localize a seção `## FAQ` e extraia pares `### Pergunta` + corpo:

```ts
type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[]; // tokens normalizados de question + answer
};

function parseFaq(markdown: string): FaqEntry[] {
  const lines = markdown.split('\n');
  const faqStart = lines.findIndex(l => /^##\s+FAQ\s*$/i.test(l.trim()));
  if (faqStart === -1) return [];

  const entries: FaqEntry[] = [];
  let i = faqStart + 1;
  let q: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (!q) return;
    const answer = buf.join('\n').trim();
    const id = normalize(q).replace(/\s+/g, '-');
    entries.push({
      id,
      question: q,
      answer,
      keywords: tokenize(`${q} ${answer}`),
    });
    q = null;
    buf = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    if (/^##\s+/.test(line)) { flush(); break; }   // próxima seção: para
    if (/^###\s+/.test(line)) { flush(); q = line.replace(/^###\s+/, '').trim(); }
    else if (q) buf.push(line);
    i++;
  }
  flush();
  return entries;
}
```

**Cache**: parseie uma única vez no carregamento do componente e guarde em memória do módulo (`let cache = null`) ou em um `useMemo`/`useState`. Não reparseie a cada query.

## Etapa 5 — Scoring

Para cada FAQ, calcule um score baseado no overlap de tokens entre a query e os keywords:

```ts
type ScoredEntry = { entry: FaqEntry; score: number };

function searchFaq(query: string, entries: FaqEntry[]): ScoredEntry[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const results: ScoredEntry[] = [];

  for (const entry of entries) {
    let score = 0;
    const questionTokens = new Set(tokenize(entry.question));
    const keywordSet = new Set(entry.keywords);

    for (const qt of queryTokens) {
      if (questionTokens.has(qt)) score += 3;        // match no título: peso alto
      else if (keywordSet.has(qt)) score += 1;        // match no corpo: peso médio
      else if ([...keywordSet].some(kw => kw.startsWith(qt) || qt.startsWith(kw))) {
        score += 0.5;                                  // prefixo (lida com plural/conjugação): peso baixo
      }
    }

    if (score > 0) results.push({ entry, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
```

### Por que esses pesos?

- **3 para match no título**: a pergunta é uma reformulação intencional do tema; matches aqui são fortes evidências de intent.
- **1 para match no corpo**: o usuário pode estar usando uma palavra que só aparece na resposta. Match útil mas mais fraco que título.
- **0.5 para prefixo**: lida com plurais ("paciente" vs "pacientes"), conjugações ("cadastro" vs "cadastrar") e digitação parcial. Não é stemming completo (que exige lib) mas pega muitos casos.

## Etapa 6 — Threshold e fallback

```ts
const top = results[0];
if (!top || top.score < 1) {
  // Fallback: sem confiança suficiente
  return {
    answer: 'Não encontrei uma resposta direta na minha base. Tente reformular sua pergunta ou consulte a aba **Guia de uso**.',
    suggestions: entries.slice(0, 3).map(e => e.question),
  };
}

return {
  answer: top.entry.answer,
  question: top.entry.question,
  related: results.slice(1, 4).map(r => r.entry),
};
```

Threshold = 1 funciona bem na prática. Abaixo disso é geralmente ruído.

## Renderização da resposta

A resposta vem do markdown e pode conter `**bold**` e quebras de linha. Renderize com um conversor inline simples (não use lib pesada):

```tsx
function renderInlineMarkdown(text: string): React.ReactNode {
  // Escape HTML primeiro
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // **bold** → <strong>
  const withBold = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // \n → <br/>
  const withBreaks = withBold.replace(/\n/g, '<br/>');

  return <span dangerouslySetInnerHTML={{ __html: withBreaks }} />;
}
```

**Sempre escape HTML antes**. Mesmo o markdown sendo confiável (vem do repo), defenda contra surpresas.

## Sugestões iniciais

Quando o chat abre pela primeira vez, mostre 3 perguntas clicáveis:
- Use as **primeiras 3 FAQs do markdown**. Coloque as mais frequentes/genéricas no topo do FAQ (ex: "Como faço o primeiro acesso?", "Como cadastro um paciente?", "Como reinicio o tour?").
- Ao clicar, simule como se o usuário tivesse digitado aquela pergunta exata.

## Perguntas relacionadas

Após a resposta principal, mostre 2-3 chips clicáveis com as próximas FAQs no ranking. Útil quando a pergunta do usuário toca em vários tópicos.

## Casos especiais

### Pergunta muito curta ("estoque")
Resultado: provavelmente várias FAQs de Estoque com score alto. Retorne a primeira como resposta principal e as outras como relacionadas. O usuário tem agora um menu.

### Pergunta muito longa (parágrafo)
A tokenização e filtragem de stopwords reduzem isso a um conjunto pequeno de termos significativos. Funciona bem.

### Pergunta com typos ("kadastro" em vez de "cadastro")
O algoritmo não corrige typos. Aceitável: as queries com typos vão direto para o fallback, e o usuário tenta de novo. Adicionar correção (Levenshtein, fuzzy match) custa CPU sem ganho proporcional.

### Pergunta em outro idioma
Se o markdown está em pt-BR e o usuário pergunta em inglês: cairá no fallback. Aceitável. Se necessário, traduza o markdown.

### Múltiplas respostas igualmente válidas
Empate de score: o `sort` não é estável em todas as engines. Para previsibilidade, adicione tiebreaker pela ordem original (índice no array de entries).

## Não faça

- ❌ TF-IDF / BM25 — overkill para ~30 entradas. Adiciona código sem ganho perceptível.
- ❌ Embeddings — exige modelo + cache + custos. Mata o "zero custo".
- ❌ Stemming completo (Porter stemmer, etc.) — exige lib. O match por prefixo cobre o suficiente.
- ❌ Spell correction (Levenshtein) — caro em JS, baixo ROI.
- ❌ Boost por "popularidade" sem dados — não há cliques para aprender. Resista até instrumentar de verdade.

## Quando trocar para algo mais sofisticado

Sinais de que vale evoluir:
- Mais de 100 FAQs e usuários reclamam de respostas erradas.
- Logs de queries mostram muitas perguntas em forma completamente diferente das FAQs.
- O produto cresce em complexidade e precisa de respostas geradas (não cadastradas).

Aí sim faz sentido evoluir para:
1. **Algolia / Meilisearch / Typesense** — indexação real, latência baixa, ainda sem IA.
2. **Embeddings + similaridade cosseno** — usando OpenAI embeddings ou sentence-transformers local. Sai do "zero custo" mas mantém respostas determinísticas.
3. **RAG** — busca por similaridade + geração com LLM. Maior custo, melhor cobertura.

Comece com o algoritmo simples deste documento. Evolua só quando os números mostrarem necessidade.
