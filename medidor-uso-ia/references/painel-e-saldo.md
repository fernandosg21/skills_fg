# Painel SaaS e saldo estimado

Referência do painel de gestão. No Memora é `saas/ia_uso.php` (rota `/ia-uso`, só
super-admin do SaaS); o back-end de agregação e saldo está em `includes/llm_usage.php`.
A ideia central: **toda chamada grava uma linha; o painel só faz `GROUP BY`**.

## 1. Rota e acesso

- Item de menu "Uso de IA" (ícone tipo `cpu`), `href` = `/ia-uso` no host do SaaS ou
  `/saas/ia_uso.php` no host normal (escolha por `appIsSaasHost()`).
- No host do SaaS, o `.htaccess` faz 301 de `/saas/ia_uso.php` → `/ia-uso` (URL bonita) e um
  rewrite interno `^ia-uso/?$ → saas/ia_uso.php [L,NC,QSA]` (preserva a querystring do período).
- Autenticação de super-admin no topo; **CSRF** no único POST (salvar créditos), com padrão
  **PRG** (Post-Redirect-Get) para não reenviar ao dar refresh.

## 2. Seletor de período

`?periodo ∈ {hoje, 7d, 30d (default), mes}` → calcula `fromDate`/`toDate`. Form GET com
`onchange="this.form.submit()"`. Toda agregação filtra `created_at >= from 00:00:00 AND <
(to + 1 dia)` (inclusivo no fim do dia).

## 3. Os blocos da tela (de cima para baixo)

1. **Cabeçalho** — título "Uso de IA", subtítulo avisando que valores em dólar são
   **estimados** pela tabela de preços dos provedores, e o seletor de período.
2. **4 cards** — (a) custo estimado do período + projeção mensal + equivalente em moeda local
   (se cotação informada); (b) tokens consumidos (entrada/saída); (c) chamadas + taxa de
   falha/fallback (fica vermelho se > 5%); (d) custo médio por conversa do agente.
3. **Saldo do provedor sem API de saldo** (Anthropic/Claude) — o bloco conceitualmente mais
   importante (seção 5). Selo "real via Admin API" vs "estimado". Saldo em fonte grande
   (vermelho se < US$ 5) + aviso "saldo baixo — recarregue". Ao lado, form do gestor para
   informar créditos, data de referência e cotação.
4. **Insights** — frases em linguagem natural geradas dos números: qual tenant concentra o
   maior % do custo, custo médio por conversa, projeção mensal, alerta se falha > 5%. Fallback
   quando não há dados.
5. **Gráficos** — barra empilhada "custo diário por provedor" e doughnut "custo por modelo·tier".
   Cores fixas por provedor. Groq (gratuito) some do gráfico de custo com a nota "gratuito não
   gera custo".
6. **Ranking por tenant** — nome do estúdio, plano, conversas (`COUNT(DISTINCT context_id)`),
   chamadas (com nº de falhas), tokens, custo, % do custo (mini-barra), última atividade.
7. **Por modelo·tier** e **Por função** — duas tabelas. "Por função" traduz o código técnico da
   `feature` para rótulo amigável (ex.: `agente_whatsapp` → "Agente WhatsApp (clientes reais)").

## 4. Agregações que o painel consome

Todas `(from, to)` com a janela da seção 2:

| Função | Retorno |
|---|---|
| `totals` | `calls`, `failed_calls` (`SUM(ok=0)`), tokens in/out, `cost_usd`, quebra `by_provider` |
| `byTenant` | ranking com JOIN na tabela de tenants (nome/plano/status) + `COUNT(DISTINCT context_id)` = conversas |
| `daily` | série diária por provedor (gráfico de barras) |
| `byModel` | quebra por provider/model/tier |
| `byFeature` | quebra por feature |

Derivadas: taxa de falha = `failed_calls/calls`; projeção mensal = `custo/dias × 30`; custo por
conversa = `custo(agente)/conversas distintas`.

## 5. Saldo estimado (o padrão-chave)

**Premissa:** provedores como a Anthropic **não expõem saldo de créditos por API** (só no
console de billing). Solução:

```
saldo estimado = créditos informados pelo gestor − gasto desde a data de referência
```

- **Créditos + data de referência** ficam em settings key/value (`anthropic_credits_usd`,
  `anthropic_credits_ref_date`). O gestor abre o console do provedor, vê quanto comprou e desde
  quando, e digita no painel. Por isso há uma **data de referência**: a estimativa só vale a
  partir da compra.
- **Gasto desde então** (`spendSince(refDate)`) tem dois modos com fallback gracioso:
  - **Real** (`source='admin_api'`) — se houver chave admin de billing (na Anthropic,
    `ANTHROPIC_ADMIN_KEY` = `sk-ant-admin…`), consulta a **Cost Report Admin API**
    (`GET /v1/organizations/cost_report?limit=31&starting_at=…`, headers `x-api-key` +
    `anthropic-version: 2023-06-01`), pagina até ~5 páginas (`next_page`/`has_more`) e **soma
    recursivamente** todos os campos `amount` numéricos do JSON. Resultado **cacheado ~1h**
    (chave `anthropic_cost_cache_<data>`, valor `{ts, amount}`).
  - **Estimado** (`source='estimado'`) — sem chave admin **ou** se a chamada falhar agora, soma
    `cost_usd` dos próprios logs (`WHERE provider='anthropic' AND created_at >= refDate`).
- `balance() → {configured, credits, refDate, spent, balance, source}`. `configured=true` só se
  créditos > 0. A UI mostra o `source` honestamente ("real" vs "estimado").

> **A Admin API dá o CUSTO (gasto), não o saldo.** Mesmo no modo "real", os créditos continuam
> sendo input humano com data de referência — o "real" só corrige o agregado do *gasto*.

Outros provedores (Gemini/Groq/OpenAI) não têm conceito de saldo aqui — só custo estimado pela
tabela de preços. Groq (llama/meta-llama) tem preço `[0,0]` (gratuito): aparece nas contagens de
chamadas/tokens, mas com custo zero.

## 6. Alertas

- **Saldo < limiar** (ex.: US$ 5) → destaque vermelho + "recarregue". Evita o agente cair no
  fallback gratuito (Groq) por falta de crédito sem o dono perceber.
- **Taxa de falha/fallback > 5%** → card vermelho + insight. `ok=false` é proxy de "bati no
  limite do provedor / provedor caiu" (ex.: estouro de TPD — tokens por dia — do tier gratuito).
- Generalização portátil: comparar `SUM(tokens|custo)` da janela contra um limite configurado
  por provedor/tenant e sinalizar em X% (amarelo) e 100% (vermelho).

## 7. Diagnóstico de provedores (NÃO é o medidor de custo)

Duas ferramentas irmãs que testam **provedores/cadeia de fallback**, não custo — úteis para
validar chaves antes de confiar no painel:
- **Navegador** (`adm/whatsapp/api/llm_smoke.php`, só admin, `text/plain`): para cada tier mostra
  a cadeia de fallback e faz **1 chamada real** (~100 tokens) ao primeiro provedor; **mascara**
  as chaves (`substr(0,6)…substr(-4)` + tamanho); se o provedor do tier não tem chave, avisa que
  "cai para o Groq".
- **CLI** (`tools/test_llm_providers.php`): mesma lógica, exit 0/1 para scripts.

## 8. Regras de UX (transferíveis)

- **Rótulos sem jargão técnico** para o dono do negócio: "Custo por conversa (agente)",
  "falhas/fallback", "Créditos comprados (US$)", "Contando a partir de", "Cotação US$ → R$".
  Uma tabela `featureLabels` traduz códigos internos (`agente_whatsapp` → "Agente WhatsApp
  (clientes reais)"). Nada de `prompt_tokens`, `TPD`, `tier` cru na tela.
- **Moeda local opcional** ao lado do USD — se o gestor informar a cotação, todos os valores
  ganham "(~R$ …)". Opcional para não travar quem só olha dólar.
- **A tela nunca dá 500.** Toda query e o cálculo de saldo em try/catch que degrada para
  "sem dados"/0/estimado. É um painel financeiro consultado sob pressão.

## 9. Contratos portáteis (resumo)

```
totals(from,to) · byTenant · byProvider · byModel · byFeature · daily(from,to)
spendSince(refDate) -> {amount, source}      // real (Admin API + cache 1h) OU estimado (logs)
balance()           -> {configured, credits, refDate, spent, balance, source}
smokeTest()         -> percorre tiers, mostra cadeia de fallback, 1 chamada mínima, mascara chaves
```

Instrumentação e modelo de dados estão em
[modelo-e-instrumentacao.md](modelo-e-instrumentacao.md).
