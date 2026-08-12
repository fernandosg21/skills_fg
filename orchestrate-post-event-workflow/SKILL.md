---
name: orchestrate-post-event-workflow
description: "Implemente ou audite fluxos de pós-evento orientados pelo pacote contratado, com etapas dependentes para seleção, edição, galeria, vídeo, álbum, aprovação e entrega, além de prazos, reconciliação e integrações. Use quando criar kanban de entregas, checklist pós-evento, desbloqueio por dependência, calendário de prazos ou sincronização entre seleção Proof e produção."
---

# Orquestrar fluxo pós-evento

## Objetivo

Transforme os entregáveis vendidos em um fluxo executável, idempotente e rastreável, preservando etapas já realizadas quando pacote ou regras evoluírem.

## Mapeie o contrato de origem

1. Levante pacotes, serviços extras, contrato assinado e dados efetivos do evento.
2. Defina qual fonte vence quando essas representações divergem.
3. Catalogue os tipos de entregável e as dependências entre eles.
4. Leia [grafo-de-etapas.md](references/grafo-de-etapas.md).
5. Identifique integrações que concluem etapas automaticamente.

## Gere o fluxo por capacidade contratada

- Use chaves estáveis de etapa; deixe os rótulos na camada de apresentação.
- Derive as etapas a partir de capacidades, não de comparação frágil com nome do pacote.
- Diferencie vídeo completo, trailer, reels, seleção, edição, galeria, diagramação, aprovação e entrega de álbum.
- Grave a versão da regra usada para montar o fluxo.
- Crie uma única instância de cada etapa por evento e entregável.
- Marque etapas não aplicáveis como ausentes/inativas; não finja conclusão.

## Modele dependências e estados

- Defina estados como bloqueada, disponível, em andamento, aguardando cliente, concluída e cancelada.
- Libere uma etapa quando todas as dependências obrigatórias estiverem concluídas.
- Permita exceção administrativa com motivo e auditoria, sem apagar a dependência original.
- Mantenha quem concluiu, quando, origem e evidência externa.
- Separe conclusão operacional de entrega pública: rascunho ou upload incompleto não conta como entregue.

## Reconcilie sem destruir histórico

1. Recalcule as etapas esperadas para o estado atual do evento.
2. Adicione as ausentes por upsert idempotente.
3. Preserve estados concluídos, comentários, prazos manuais e vínculos externos.
4. Só desative etapa ainda intocada quando ela deixar de se aplicar.
5. Nunca rebaixe automaticamente uma etapa que representa compromisso externo já iniciado.
6. Registre o que a reconciliação alterou.

Rode reconciliação em ponto controlado ou throttled; evite DDL e varreduras pesadas em todo carregamento.

## Calcule prazos com origem explícita

- Defina offsets por tenant/tipo de entrega e evento âncora, como data do evento, seleção finalizada ou envio ao fornecedor.
- Grave a origem do prazo e permita override auditado.
- Recalcule prazos derivados ao reagendar o evento, sem sobrescrever prazo manual.
- Mostre atrasado apenas quando a etapa já puder começar e houver prazo válido.
- Alimente calendário e relatório a partir do mesmo contrato de prazo.

## Integre sistemas laterais

- Seleção finalizada pode liberar diagramação.
- Galeria publicada pode concluir entrega digital; rascunho não pode.
- Álbum enviado para aprovação muda a etapa para aguardando cliente.
- Aprovação do cliente libera produção/encadernação.
- Use IDs externos e tenant validados; webhooks e sweeps devem ser idempotentes.
- Encerre follow-ups e notificações que ficaram obsoletos quando uma etapa avança.

## Entregue operação pesquisável

- Mostre pendentes e concluídas, com busca transversal por cliente, evento, local, data e entregável.
- Preserve o termo ao alternar abas e indique quando resultados estão em outra visão.
- Atualize status, filtros e detalhes via Ajax.
- No celular, mantenha próxima ação, prazo e bloqueio legíveis sem depender de hover.

## Valide

- Teste pacotes só de foto, foto+vídeo, reels e álbum completo.
- Teste mudança de pacote antes e depois de etapas concluídas.
- Teste duas execuções da criação e reconciliação.
- Teste reagendamento, prazo manual e evento cancelado.
- Teste integrações fora de ordem e webhook repetido.
- Confirme que galeria em rascunho não conclui entrega e seleção finalizada libera apenas dependentes corretas.
- Teste isolamento entre tenants e ownership de todo vínculo externo.

## Critérios de conclusão

Considere pronto quando o fluxo representa exatamente o que foi vendido, cada desbloqueio pode ser explicado e reconstruir o grafo não apaga nem regride trabalho já realizado.
