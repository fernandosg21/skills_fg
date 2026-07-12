---
name: agente-atendimento-whatsapp
description: Implementa um agente autônomo de atendimento no WhatsApp (vendedor consultivo por IA) que responde clientes sozinho com segurança — memória durável por conversa (não repete perguntas), roteamento multi-provedor de LLM com escalonamento determinístico e fallback, prompt de vendas com guardrails que nunca inventam preço/desconto nem fecham venda, travas de opt-in/blocklist/pausas, ingestão idempotente anti-eco, follow-through de agenda, fechamento determinístico com handoff humano e painel de controle/observabilidade. Use quando o usuário pedir chatbot ou agente de WhatsApp/atendimento, atendente virtual, bot de vendas por IA, responder leads automaticamente, SDR/vendedor por IA, autoresponder de WhatsApp, integração com Evolution API/Meta Cloud API, ou automação de atendimento conversacional. Agnóstico de linguagem (Node, Python, Ruby, Go, PHP) e de banco. Baseada na implementação de referência do Memora (a:\Site Fotografia\Memora.fot.br). Para medir tokens/custo das chamadas de IA, veja a skill medidor-uso-ia.
---

# Agente autônomo de atendimento no WhatsApp (vendedor consultivo)

Skill de implementação: replica em qualquer projeto o agente de atendimento do Memora — um
LLM que conversa com o cliente pelo WhatsApp, vende de forma consultiva e **age sozinho com
segurança**. As citações `arquivo:linha` nos references apontam para a referência em
`a:\Site Fotografia\Memora.fot.br` (`adm/whatsapp/`); os references contêm o essencial mesmo
sem acesso a ela.

Skill irmã: [`medidor-uso-ia`](../medidor-uso-ia) — mede tokens/custo de cada chamada de LLM
(o agente é o maior gerador de chamadas). Instrumente as duas juntas.

## O princípio-mestre (a única frase para lembrar)

> **O LLM conduz e encanta; o código detém tudo que envolve dinheiro, compromisso e
> disponibilidade.** O modelo é livre para conversar; os momentos de risco (consultar agenda,
> falar de preço/parcelamento, fechar venda) são interceptados por código determinístico
> ANTES e/ou DEPOIS da chamada ao modelo.

Um agente que "só responde com IA" é fácil e perigoso. Todo o valor desta skill está nas
**travas em volta do LLM**: opt-in, memória, anti-duplicação, anti-eco, guardrails de venda,
fechamento determinístico, observabilidade. Sem elas, o agente responde duas vezes, responde
mensagem velha, inventa preço, promete contrato, atropela o atendimento humano ou some sem o
dono saber.

## Referências (leia conforme a etapa)

| Arquivo | Conteúdo |
|---|---|
| [references/arquitetura-e-dados.md](references/arquitetura-e-dados.md) | Fluxo ponta a ponta, componentes e as 5 entidades de dados (conversation, message, decision, profile, settings) + regras de schema idempotente |
| [references/travas-e-guardas.md](references/travas-e-guardas.md) | **O coração**: as ~20 travas do responder na ordem exata, duplo opt-in, gate, fail-open vs fail-closed, pausas/retomada, blocklist, sanitização |
| [references/memoria-duravel.md](references/memoria-duravel.md) | Memória por conversa (fatos + perguntas), extração determinística, "silêncio não apaga", detecção de "já perguntei" — mata a repetição de perguntas |
| [references/roteamento-llm.md](references/roteamento-llm.md) | Tiers, seleção determinística, cadeia de fallback que sempre termina no piso, clientes por wire-protocol (as pegadinhas da Messages API), deploy seguro antes das chaves |
| [references/prompt-vendedor-consultivo.md](references/prompt-vendedor-consultivo.md) | Perfil por tenant, estilos, montagem do prompt, 10 guardrails duros, playbook A–G, follow-through de agenda, fechamento determinístico |
| [references/ingestao-anti-eco-e-agendamento.md](references/ingestao-anti-eco-e-agendamento.md) | ACK rápido de webhook, upsert idempotente, marcador `source`, adoção de eco, lock por conversa, despacho agendado por claim atômico (cron-independente) |
| [references/painel-observabilidade-e-testes.md](references/painel-observabilidade-e-testes.md) | Estado efetivo com blockers, log de decisões, fila "sem resposta", clientes atendidos, alertas, e a estratégia de testes em 3 camadas + cicatrizes de produção |

## Ordem de implementação

Cada etapa funciona sem as seguintes — dá para entregar valor incremental e parar em qualquer
ponto. Comece em **modo aprendizado** (o agente observa e sugere, mas não envia) e só depois
ligue o autônomo.

1. **Schema + ingestão idempotente** — as 5 entidades ([arquitetura-e-dados.md](references/arquitetura-e-dados.md))
   e o webhook com **ACK rápido** + upsert deduplicado ([ingestao-anti-eco-e-agendamento.md](references/ingestao-anti-eco-e-agendamento.md)).
   Migração idempotente, schema fora de transação.
2. **Envio com marcador de origem** — `send(..., source, pause_agent)`: toda saída carrega
   `source` (`ai_agent`/humano); envio humano pausa o bot, envio do bot não.
3. **Perfil e prompt (modo aprendizado)** — o registro por tenant, os 3 knobs de estilo e a
   montagem do prompt ([prompt-vendedor-consultivo.md](references/prompt-vendedor-consultivo.md)).
   Um "testar agente" que gera resposta sem enviar já entrega valor.
4. **Roteamento de LLM** — registry de provedores, tiers, seleção determinística e cadeia de
   fallback ([roteamento-llm.md](references/roteamento-llm.md)). Instrumente o uso desde já com a
   skill [`medidor-uso-ia`](../medidor-uso-ia).
5. **Memória durável** — fatos + perguntas por conversa; extração determinística; detecção de "já
   perguntei" ([memoria-duravel.md](references/memoria-duravel.md)). Sem isso o agente repete
   perguntas.
6. **Guardrails determinísticos** — consulta de agenda ANTES + follow-through DEPOIS; detecção de
   objeção e de "quer fechar" por regex; fechamento com handoff + pausa + tarefa humana.
7. **As travas do responder** — implemente a sequência exata de guardas
   ([travas-e-guardas.md](references/travas-e-guardas.md)): opt-in, gate, lock, é-a-última,
   idempotência, limites (dia fail-closed / hora fail-open), pré-check de conexão, re-checagem de
   corrida, rede de segurança sem vácuo.
8. **Anti-eco** — adoção de eco sem id do provedor + guarda de 180s + lock por conversa, para o
   eco do próprio agente não virar "intervenção humana".
9. **Painel de controle + observabilidade** — o **estado efetivo com blockers**, o log de
   decisões, a fila "conversas sem resposta" (1 clique), clientes atendidos e alertas ao dono
   ([painel-observabilidade-e-testes.md](references/painel-observabilidade-e-testes.md)).
10. **Testes** — 3 camadas (lógica pura sem I/O, contrato de API com cliente stubado, smoke ao vivo
    mínimo). Reproduza cada bug encontrado como caso de teste.
11. **Ligar o autônomo** — só depois de tudo acima: mudar o modo do perfil para autônomo e validar
    com 2 mensagens seguidas reais.

## Decisões de projeto que importam (não mude sem motivo)

- **Um único "modo", flags derivadas.** O dono edita `off`/`aprendizado`/`autônomo`; o código
  deriva as flags técnicas no save (invariante: `autônomo ⟺ habilitado && !aprovação_pendente`).
  Nunca exponha flags soltas — geram o estado "meio ligado" (chip "Ligado", agente mudo).
- **O selo de estado reutiliza a MESMA condição do motor.** Se a UI e o runtime avaliam condições
  diferentes, o selo mente. Uma função compartilhada é a fonte única de "o agente responde?".
- **Fechamento e objeção por regex, nunca por LLM.** São eventos de negócio (pausar, criar tarefa,
  escolher modelo forte); não podem depender de o modelo "entender". O fechamento sai do LLM:
  texto determinístico que celebra, resume e passa para o humano — nunca inventa preço nem promete
  contrato.
- **Pagamento/parcelamento só do que está escrito.** O LLM só cita condição de pagamento se
  estiver nas regras comerciais do perfil; sem isso, "o responsável confirma". Nunca inventa
  desconto/promoção.
- **Consulta de risco ANTES do LLM + follow-through DEPOIS.** A agenda é consultada por código e
  injetada no contexto; se o modelo tentar adiar ("vou verificar"), o código anexa o desfecho real
  na mesma mensagem.
- **Memória durável separada da janela.** A janela é custo/contexto; os fatos são eternos.
  Aumentar a janela é paliativo — a memória durável é a cura da repetição de perguntas.
- **Limite por conversa = fail-closed; limite global = fail-open.** Um erro numa contagem global
  não pode calar todos os clientes do tenant; o teto por conversa segura o dano. Decisão consciente
  de blast radius.
- **Marcador `source` é load-bearing.** Distingue automático de humano; sustenta rate limit,
  painel e anti-eco. Proteja-o contra sobrescrita pelo eco (primeira-gravação-vence).
- **Deploy seguro antes das chaves.** A cadeia de LLM sempre termina num provedor-piso; sem as
  chaves premium, o comportamento é idêntico ao antigo. Dá para subir o código e provisionar as
  chaves depois.

## Gotchas (cicatrizes da implementação de referência)

- **"Ativei e não respondeu"** quase sempre é (a) duplo opt-in não salvo (perfil "meio ligado"),
  (b) conversa pausada como `human_takeover` sem caminho de despausar, ou (c) canal desconectado.
  O **estado efetivo com blockers** existe para diagnosticar isso na cara do dono.
- **O eco do provedor pausa o agente por engano** se a adoção/guarda não casar (texto alterado,
  atraso > 180s, marcador `source` apagado). Comparação de texto **byte-a-byte** e marcador
  intacto são obrigatórios.
- **Regenerar o id placeholder** (quando o provedor não devolve id) faz payload e chave divergirem
  e quebra a adoção de eco. Gere o hex **uma vez** e reuse.
- **DDL faz commit implícito** — rode o setup de schema fora de transação; senão o rollback de um
  teste não desfaz nada.
- **`SHOW COLUMNS … LIKE ?` quebra com prepared no MySQL 5.7** e **`REGEXP_REPLACE` não existe**
  lá — use `INFORMATION_SCHEMA` com placeholders e faça normalização de telefone/texto na
  aplicação. Nunca use um "coluna existe?" que engole exceção.
- **A memória é entrada não-confiável** — normalize (allowlist + truncamento + cap de tamanho) na
  leitura E na escrita; pode vir corrompida do banco ou envenenada pelo LLM.
- **Sanitização pode zerar a resposta** — se a limpeza anti-vazamento esvazia o texto e o modelo
  tinha respondido, prefira o **silêncio** a mandar texto inseguro.
- **Detecção de intenção é regex (não NLU)** sobre texto normalizado sem acento — gírias fora dos
  padrões podem não disparar fechamento/pedido-de-humano. É lista de padrões, não compreensão.

## Checklist de verificação (mobile + desktop no painel)

- [ ] Perfil salvo em "autônomo" força habilitado=1/aprovação=0 (sem estado "meio ligado")
- [ ] O selo de estado bate com o runtime: mostra "Em silêncio" + blocker correto quando não responde
- [ ] Grupo do WhatsApp → agente nunca responde
- [ ] Contato na blocklist → agente nunca responde (match tolera o 9º dígito)
- [ ] Duas mensagens picadas em sequência → o agente responde **uma vez**, com o contexto completo
- [ ] Reprocessar o mesmo webhook → não gera resposta duplicada (idempotência)
- [ ] Dado informado no início da conversa não é re-perguntado 30+ mensagens depois (memória durável)
- [ ] Cliente diz "quero fechar" → resposta determinística + pausa `cliente_quer_fechar` + tarefa na fila
- [ ] Objeção de preço → escala para o modelo forte; "vou pensar" sem preço mostrado → não escala
- [ ] Agenda consultada: o desfecho real aparece na mesma mensagem (sem "vou verificar" solto)
- [ ] Resposta humana pausa o agente; a resposta do próprio agente NÃO se auto-pausa (anti-eco)
- [ ] Canal desconectado → não gasta LLM, avisa o dono, entra na fila "sem resposta"
- [ ] Toda cadeia de LLM cai → mensagem-ponte (1x/6h), nunca vácuo
- [ ] Cada inbound processada gera 1 linha de decisão (auditoria)
- [ ] "Conversas sem resposta" oferece 1 ação certa por item (reenviar/reativar/ligar/conectar)
- [ ] Uso/custo de cada chamada instrumentado (skill medidor-uso-ia)
- [ ] Testes de lógica pura passam sem rede/banco; smoke ao vivo pula provedor sem chave
- [ ] Rótulos do painel sem jargão técnico (o dono é não-técnico)

## Saída esperada ao final

1. **Pipeline de webhook** com ACK rápido e ingestão idempotente.
2. **Responder autônomo** com a sequência completa de travas, começando em modo aprendizado.
3. **Memória durável** por conversa e extração determinística de fatos.
4. **Roteamento multi-LLM** com fallback e redação de PII, instrumentado pela skill medidor-uso-ia.
5. **Prompt de vendedor consultivo** com guardrails, follow-through e fechamento determinístico.
6. **Painel de controle** com estado efetivo, log de decisões, fila "sem resposta", clientes
   atendidos e alertas — desktop **e** mobile.
7. **Testes** nas 3 camadas + cada bug reproduzido como caso.
8. **README/PR** explicando como ligar o autônomo, provisionar chaves de provedor e estender as
   políticas do perfil.

Se algum item ficar de fora do escopo, **declare explicitamente** — um agente autônomo sem as
travas é pior que um sem agente, porque age com autoridade sobre dinheiro e sobre o cliente.

## Notas finais

- **Reuse antes de criar.** Se o projeto já tem envio de mensagem, sistema de notificações,
  auth/CSRF, um cliente HTTP — use-os. Não introduza uma stack paralela.
- **Comece cauteloso.** Modo aprendizado → autônomo com aprovação → autônomo pleno. Ligue por
  conta/conversa antes de ligar para todos.
- **Instrumente desde o dia 1.** Sem o log de decisões e o medidor de uso, você fica cego sobre o
  que o agente fez e quanto custou.
