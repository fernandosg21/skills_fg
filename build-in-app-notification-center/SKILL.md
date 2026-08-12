---
name: build-in-app-notification-center
description: "Implemente ou audite uma central de notificações multi-tenant com eventos de domínio, deduplicação, prioridades, links de ação seguros, estado lida/arquivada, preferências, digests, e-mail opcional, outbox e retenção. Use quando alertas de pagamento, agenda, equipe, entrega ou falha operacional precisam chegar à pessoa certa sem repetir indefinidamente."
---

# Construir central de notificações in-app

## Objetivo

Converta sinais do produto em avisos acionáveis e persistentes. Diferencie notificação, tarefa e mensagem ao cliente, e trate entrega por canal como efeito recuperável.

## Mapear sinais e públicos

1. Liste eventos de domínio que merecem aviso e quem precisa agir.
2. Identifique fontes atuais, crons, banners, e-mails e contadores duplicados.
3. Defina severidade, prazo, ação, dedupe e condição de resolução.
4. Leia [contrato-de-notificacao.md](references/contrato-de-notificacao.md).
5. Separe avisos do tenant de alertas globais da operação SaaS.

## Modelar notificações como projeção

- Persista tenant, destinatário ou papel, tipo estável, título, corpo curto, severidade, ação e contexto opaco.
- Use uma chave de deduplicação derivada do fato, não do texto traduzido.
- Guarde estado unread, read, archived ou resolved separado do estado de entrega por canal.
- Não use a notificação como fonte de verdade do pagamento, evento ou tarefa.
- Quando o fato mudar, atualize/resolva a projeção idempotentemente.

## Produzir a partir de eventos

- Publique eventos após o commit da regra de negócio.
- Faça cada produtor declarar tipo, público, dedupe key e validade.
- Permita upsert para fatos contínuos, como parcela ainda atrasada.
- Crie nova ocorrência para eventos historicamente distintos.
- Remova/resolva o aviso quando a condição deixar de existir.
- Evite varreduras completas a cada page load; use jobs ou consultas incrementais.

## Autorizar leitura e ação

- Filtre todas as consultas por tenant e destinatário/membership.
- Não aceite tenant ou user ID do cliente sem confirmar sessão.
- Valide novamente o recurso ao abrir a ação.
- Use rotas internas allowlisted ou identificadores de ação; não salve redirect arbitrário.
- Retorne 404/403 sem vazar existência de aviso de outro tenant.
- Ações administrativas exigem o mesmo gate da tela original.

## Deduplicar e agrupar

- Deduplique por identidade do fato e janela declarada.
- Não use LIMIT 1 sem ordenação como solução de duplicidade.
- Agrupe na UI por tipo/contexto, mantendo contagem e item mais recente.
- Evite criar o mesmo aviso no cron, webhook e carregamento de página.
- Registre último_seen_at ou occurrence_count quando um fato recorrente atualizar o mesmo aviso.

## Entregar por canais

1. Resolva preferências, horário silencioso e canal permitido.
2. Persista outbox antes de e-mail, push ou WhatsApp.
3. Use idempotência por notificação + canal + versão.
4. Classifique aceite, falha transitória, falha definitiva e resultado desconhecido.
5. Não marque como lida só porque um e-mail foi entregue.
6. Para digest, marque quais ocorrências entraram na edição e não as repita.

## Criar UX útil

- Mostre contador não lido consistente no desktop e mobile.
- Permita marcar item, grupo ou todos como lidos via Ajax.
- Preserve filtros e posição da lista.
- Destaque severidade sem usar cor como único sinal.
- Inclua ação clara quando houver algo a fazer; caso contrário, explique o estado.
- Não exponha stack trace, token, CPF, mensagem privada ou detalhes técnicos desnecessários.

## Aplicar retenção e observabilidade

- Defina TTL por tipo e preserve auditoria exigida em fonte própria.
- Arquive ou agregue alto volume para evitar crescimento ilimitado.
- Meça produzidas, deduplicadas, abertas, resolvidas, expiradas e falhas por canal.
- Alerte sobre produtor silencioso e fila parada, não apenas sobre erros explícitos.

## Validar

- Mesmo fato chegando por cron e webhook.
- Fato resolvido antes de o usuário abrir.
- Dois usuários do mesmo tenant com preferências diferentes.
- Usuário removido com notificações pendentes.
- Link de ação para recurso apagado ou de outro tenant.
- Digest reexecutado e timeout de e-mail.
- Marcar como lida em duas abas.
- Carga alta sem DDL ou scans completos no page load.

## Critérios de conclusão

Considere pronto quando cada aviso deriva de um fato identificável, aparece apenas ao público autorizado, converge quando o fato muda e pode ser entregue por canais sem duplicar ou alterar indevidamente seu estado de leitura.
