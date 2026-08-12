---
name: build-event-calendar-sync
description: "Implemente ou audite uma agenda multi-tenant de eventos com intervalos, bloqueios globais ou por profissional, detecção de conflitos, reagendamento e sincronização resiliente com Google Calendar ou outro provedor. Use quando criar calendário operacional, agenda de equipe, bloqueio de datas, convites, attendees, espelhos de eventos ou hooks de reagendamento."
---

# Construir agenda de eventos sincronizada

## Objetivo

Mantenha a agenda interna como fonte de verdade e espelhe eventos, bloqueios e convites em calendários externos sem criar duplicatas nem perder participantes.

## Antes de implementar

1. Mapeie todas as rotas que criam, editam, cancelam e reagendam eventos.
2. Localize consumidores de data e horário: contratos, equipe, entregas, mensagens, financeiro e calendários externos.
3. Identifique fusos, duração padrão, eventos que atravessam meia-noite e regras de disponibilidade.
4. Leia [conflitos-e-sincronizacao.md](references/conflitos-e-sincronizacao.md).
5. Defina a autoridade de cada campo antes de integrar um provedor.

## Modele tempo corretamente

- Armazene instantes ou data/hora com fuso conhecido; converta somente na borda.
- Modele o período como intervalo semiaberto `[início, fim)` para permitir eventos encostados.
- Calcule o fim por horário explícito ou duração de cobertura, sem truncar eventos após meia-noite.
- Diferencie evento, ensaio, tarefa e bloqueio por tipo estável.
- Escopo todas as consultas e índices por tenant.

## Detecte conflitos com contexto

- Considere conflito quando `existente.início < proposto.fim` e `existente.fim > proposto.início`.
- Ignore o próprio evento durante edição.
- Modele bloqueio global e bloqueio de profissionais específicos.
- Compare identidades de profissionais por ID; use nome normalizado apenas como fallback legado.
- Mostre o item conflitante, intervalo e motivo; não responda apenas `indisponível`.
- Valide novamente no backend imediatamente antes de salvar.

## Faça do reagendamento um serviço único

1. Valide ownership, intervalo e conflito.
2. Atualize o evento em transação curta.
3. Registre auditoria com valores anterior e novo.
4. Recalcule prazos derivados por regras explícitas.
5. Reconcilie convites e clones aceitos.
6. Enfileire atualização de calendário e notificações após o commit.
7. Exponha estado parcial quando uma integração externa falhar.

Faça todos os entrypoints chamarem esse serviço; não replique efeitos colaterais em cada tela.

## Sincronize com provedor externo

- Guarde o ID remoto junto do tenant e do item local.
- Mantenha estados como não configurado, pendente, sincronizado e erro, com horário e mensagem da última tentativa.
- Antes de criar, procure o vínculo local e valide se o item remoto ainda existe.
- Atualize quando houver vínculo válido; recrie apenas quando o remoto estiver comprovadamente ausente.
- Preserve `attendees` em updates. Busque participantes da equipe por vínculo tenant-scoped e normalize e-mails.
- Use o modo do provedor que envia ou suprime convites conforme a intenção do produto.
- Não deixe a falha externa desfazer o salvamento interno; marque para retry e mostre o estado.
- Trate exclusão e cancelamento como operações idempotentes.

## Proteja convites entre contas

- Modele anfitrião, convidado, evento de origem e clone aceito por IDs explícitos.
- Ao aceitar, crie no máximo um clone e remova dados privados que o convidado não precisa ver.
- Ao editar o evento anfitrião, atualize somente clones vinculados e preserve alterações locais autorizadas.
- Ao remover um membro, revogue convites pendentes e reconcilie o clone conforme a regra de negócio.

## Entregue uma interface operacional

- Ofereça mês, semana e dia, com navegação acessível no celular.
- Atualize filtros e detalhes via Ajax sem perder o período atual.
- Mostre eventos, bloqueios e solicitações comerciais com distinção visual e sem misturar suas semânticas.
- Deixe a IA fora do carregamento do calendário; análise de uma solicitação acontece ao abrir aquele item.

## Valide

- Teste eventos adjacentes, sobrepostos, sem hora e atravessando meia-noite.
- Teste bloqueio global, por profissional e equipe parcialmente disponível.
- Teste criação, update, exclusão, remoto ausente, timeout e retry.
- Confirme que participantes permanecem após reagendamento.
- Teste convite aceito, recusado, removido e duas execuções do mesmo webhook.
- Teste dois tenants com o mesmo ID local aparente ou o mesmo profissional nominal.
- Confira efeitos em prazos, mensagens e entregas depois do reagendamento.

## Critérios de conclusão

Considere pronto quando toda escrita de agenda passa pelo mesmo contrato, conflitos são determinísticos e a indisponibilidade do provedor externo não corrompe nem duplica a agenda interna.
