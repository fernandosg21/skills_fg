---
name: build-album-proofing-workflow
description: "Implemente ou audite a prova digital de álbum depois da criação do projeto, cobrindo capa, lâminas ordenadas, versões, comentários por página, correções, telemetria de leitura, aprovação com evidências e sincronização de produção. Use quando criar revisão de diagramado, flipbook de álbum, rodadas de ajustes, aprovação pública ou resumo de feedback por IA."
---

# Construir prova e aprovação de álbum

## Objetivo

Permita que o cliente folheie, comente e aprove uma versão exata do álbum, enquanto o fotógrafo mantém histórico completo de correções e sabe o que foi realmente visto.

## Delimite o escopo

Use esta skill para o fluxo após o projeto existir. Para criar a tela inicial de modelo/tamanho e redirecionar ao upload, use a skill de criação de projeto digital já existente quando disponível.

1. Mapeie projeto, cliente, evento, storage, versões, páginas, comentários e integrações.
2. Identifique acessos autenticados, públicos e integrados a outro sistema.
3. Defina a evidência necessária para uma aprovação válida no produto.
4. Leia [versoes-leitura-e-aprovacao.md](references/versoes-leitura-e-aprovacao.md).
5. Preserve arquivos e versões antigas; não substitua histórico no lugar.

## Modele o álbum e suas versões

- Trate capa como slot próprio; excluir a capa não promove a primeira lâmina.
- Ordene lâminas por posição estável dentro de uma versão.
- Crie uma nova versão para cada rodada enviada ao cliente.
- Faça a versão apontar para assets imutáveis ou snapshots; não reescreva a versão aprovada.
- Vincule comentários e pedidos de correção à versão e à lâmina exatas.
- Guarde estado do projeto separado do estado da versão atual.

## Construa o ciclo de revisão

1. O fotógrafo envia e ordena capa/lâminas.
2. Publica uma versão para revisão.
3. O cliente folheia e comenta por lâmina.
4. O fotógrafo encerra a coleta daquela rodada e produz correções.
5. Envia nova versão preservando a anterior.
6. O cliente aprova uma versão específica.
7. O sistema emite evento idempotente para produção/entrega.

Atualize comentários, upload e troca de versão via Ajax sem exigir reload, mas mantenha fallback seguro em falha de sessão.

## Registre leitura sem fabricar prova

- Identifique a sessão/cliente por chave estável e migrável.
- Registre primeira visualização, páginas abertas, tempo plausível e última atividade.
- Não conte prefetch, reload rápido ou aba invisível como leitura integral sem regra explícita.
- Antes de aprovar, mostre páginas não vistas e peça confirmação adicional.
- Grave na aprovação a versão, ator, horário, páginas vistas, páginas puladas e texto/versão do aceite.
- Preserve a confirmação mesmo depois de novas versões administrativas.

## Suporte acesso público com conversão segura

- Permita identificação mínima para folhear/comentar quando o produto aceitar cliente ainda não cadastrado.
- Exija cadastro completo antes da aprovação, se essa for a regra.
- Resolva duplicidade por e-mail conforme política; trate telefone compartilhado apenas como possível duplicata, não merge automático.
- Ao converter, crie cliente no sistema principal, vincule o usuário local e migre a chave de telemetria antes de aprovar.
- Entregue credencial inicial uma única vez por canal seguro e não mantenha o álbum em modo público depois do vínculo.

## Resuma feedback por IA com cache

- Execute somente quando o fotógrafo clicar em resumir.
- Envie comentários e solicitações da versão atual, com PII mínima.
- Limite a uma chamada por request.
- Salve resumo, itens de ação, versão e hash/contador dos comentários usados.
- Reutilize o resumo enquanto o conjunto de feedback não mudar.
- Nunca deixe a IA marcar correção como concluída ou aprovar em nome do cliente.

## Sincronize sistemas laterais

- Vincule produção por ID estável do projeto e tenant, não por título.
- Mapeie envio para revisão e aprovação para estados monotônicos de produção.
- Não rebaixe pedido já enviado à encadernadora, pronto ou entregue.
- Emita eventos idempotentes para pós-evento e prazos.
- Preserve branding herdado quando a conta integrada definir a fonte de verdade.

## Valide

- Teste capa ausente, substituída e excluída.
- Teste reorder, upload corrigido e navegação entre duas versões sem reload.
- Teste comentário na versão antiga e isolamento entre projetos/tenants.
- Teste aprovação com tudo visto, páginas puladas, clique duplicado e versão alterada em outra aba.
- Teste acesso público, cadastro, possível duplicata e migração da telemetria.
- Teste resumo de IA em falha e reuso do cache.
- Teste integração repetida e atualização atrasada de produção.

## Critérios de conclusão

Considere pronto quando a aprovação aponta para bytes e versão inequívocos, a leitura é auditável sem exagero e nenhuma correção destrói a rodada anterior.
