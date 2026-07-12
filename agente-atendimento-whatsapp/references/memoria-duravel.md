# Memória durável por conversa

O bug clássico de um agente de atendimento: **ele repete perguntas já respondidas** ("qual a
data?", "que horas?", "onde vai ser?"). A causa raiz é a **janela de histórico**: só as N
mensagens recentes vão ao prompt (limite de custo/contexto); o que o cliente disse no começo
escorrega para fora e o agente re-pergunta.

**Aumentar a janela é paliativo** — basta uma conversa mais longa que o novo limite para o bug
voltar. A cura estrutural é uma **memória durável**: um documento por conversa que guarda os
fatos e as perguntas já feitas, e que **nunca "rola para fora"**.

Referência: `adm/whatsapp/backend/agent_memory.php` + coluna
`whatsapp_conversations.agent_memory_json`.

## Separe DOIS estados de conversa

1. **Janela de mensagens** — as N mais recentes (no Memora, 30), para o prompt. Limitada por custo.
2. **Memória durável** — o documento JSON abaixo, chaveado por (tenant, conversa). Eterno.

Só o (2) impede a re-pergunta. Trate a janela como custo/contexto e a memória como a **fonte da
verdade dos fatos**.

## O documento

```json
{
  "facts": {                       // dados definitivos informados pelo cliente
    "tipo_evento": "...", "data_evento": "YYYY-MM-DD",
    "hora_evento": "HH:MM", "hora_fim": "HH:MM",
    "localizacao": "...", "idade_aniversariante": "..."
  },
  "asked": {                       // perguntas que o agente JÁ fez
    "data_evento": true, "hora_evento": true, "localizacao": true
  },
  "replies_date": "YYYY-MM-DD",    // dia de referência do contador diário
  "replies_today": 0,              // respostas automáticas HOJE nesta conversa (anti-loop)
  "last_reply_at": "…", "last_hold_at": "…", "updated_at": "…"
}
```

As **chaves de `facts` são uma lista fixa** (allowlist); as de `asked` também. Nada fora da
lista entra — é uma trava de segurança (a memória é adulterável no banco e "envenenável" pelo
LLM).

## Contratos (funções puras, sem banco)

| Função | Regra |
|---|---|
| `defaults()` | Documento vazio. |
| `normalize(raw)` | Mantém só chaves da allowlist; trunca cada fato (ex.: 200 chars); limita contadores (`replies_today ∈ [0,10000]`); valida `replies_date` por regex `YYYY-MM-DD`; trunca carimbos. **Roda em TODA leitura E escrita** (defesa em profundidade). |
| `merge_facts(mem, novos)` | Novo não-vazio sobrescreve; **valor vazio NUNCA apaga** um fato existente. |
| `effective_facts(mem, frescos)` | Base = `mem.facts`; **fato fresco não-vazio vence**. É o que vai ao prompt. |
| `mark_asked(mem, {campo:true})` | Marca de forma persistente o que já foi perguntado. |
| `register_reply(mem)` | Se `replies_date != hoje`, zera; incrementa; carimba. Base do teto diário. |
| `register_hold(mem)` / `hold_sent_recently(mem, horas)` | Limita a mensagem-ponte a 1x a cada N horas via `last_hold_at`. |

No `save`, além de `normalize`, o Memora **rejeita o documento se passar de ~20 KB** e nunca
lança (erro vira log + `return false`).

## Duas regras que evitam bug

- **"Silêncio não apaga."** `merge_facts` só sobrescreve com valor não-vazio. Cliente corrige →
  a memória acompanha; cliente cala → a memória mantém.
- **"Fato fresco vence."** A extração da mensagem atual sobrepõe a memória quando não-vazia —
  permite o cliente corrigir a data sem lógica extra.

## Extração de fatos — determinística, NÃO por LLM

Um extrator por campo (data, hora, tipo de evento, local, idade) via regex/normalização. Barata,
previsível, roda mesmo com o LLM fora, e não gasta token para "lembrar". Rode em **dois pontos**:
1. No classificador de intenção da conversa.
2. **Direto na última mensagem do cliente** — porque respostas curtas ("às 15h", "no buffet X")
   não disparam intenção comercial quando o começo já saiu da janela. Se a memória **já tem
   fatos**, assuma que a conversa é comercial e force a extração assim mesmo.

## Reconhecimento de entidade com valor canônico

Mapeie variantes para um **valor canônico literal** guardado no store. Exemplo real: "na minha
casa" / "em casa mesmo" / "aqui em casa" → guardado como **`"na casa do cliente"`** (o que a
**equipe** lê), e re-humanizado para **"na sua casa"** só na fala com o cliente. Guardar a forma
falada quebra consistência de dados; falar a forma canônica soa robótico.

Proteja o extrator genérico de local com: blacklist de falsos positivos ("em breve", "na hora",
"no dia"…), skip de primeira-palavra suspeita ("dia", "data", "hora", "sistema"…), e **não deixe
o casamento atravessar quebra de linha** (senão duas mensagens viram um único "local").

## Detecção de "já perguntei" (duas fontes, união)

Reconstrua `asked` de DUAS fontes e faça a **união**:
1. Varra as mensagens de **saída na janela** procurando as palavras da pergunta ("data/que
   dia/quando", "horário/que horas", "local/onde/endereço").
2. Leia o `asked` **persistido** na memória (cobre o que já saiu da janela).

Injete no prompt: um resumo dos fatos já informados ("estes dados já foram respondidos: … —
nunca pergunte de novo") **+** as perguntas já feitas. Usar só uma das fontes reintroduz a
repetição.

## Ordem de gravação (importa)

Grave a memória **só após o envio bem-sucedido**, nesta ordem:
`merge_facts` → `mark_asked` (marcando o que a **própria resposta enviada** acabou de perguntar)
→ `register_reply` → `save`. Antes de enviar, cheque se chegou mensagem nova durante a geração
(anti-corrida).

## `last_hold_at` e contadores têm papéis distintos

- `replies_today` / `replies_date` — contador diário auto-resetável; base do teto de 40/dia por
  conversa.
- `last_hold_at` — carimbo da mensagem-ponte; limita a ponte a 1x/6h por conversa. Também conta
  como reply.

## Travas de segurança (portáveis)

Allowlist de chaves; truncamento por campo; cap de tamanho do documento (rejeita > ~20 KB);
validação de formato de data; escopo por tenant em toda query; contador diário como teto
anti-spam; ponte com cooldown temporal. **A memória é entrada não-confiável — normalize sempre.**
