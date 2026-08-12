---
name: build-photo-selection-proof
description: "Implemente ou audite uma galeria de prova para o cliente selecionar fotos, com upload em lote, derivados, marca d'água, limite contratado, acesso público seguro, finalização, reabertura auditada e exportação. Use quando criar seleção de fotos para álbum, impressão ou edição, portal Proof, galeria de favoritos com cota ou integração da seleção ao fluxo pós-evento."
---

# Construir seleção de fotos no estilo Proof

## Objetivo

Permita que o fotógrafo publique uma prova leve e protegida enquanto o cliente seleciona exatamente o que foi contratado, sem alterar originais nem perder escolhas em uploads, retries ou concorrência.

## Antes de implementar

1. Mapeie autenticação, tenant/owner, clientes, eventos, pacotes, storage e processamento de imagens.
2. Defina quem cria, quem visualiza, quem seleciona e quem pode finalizar/reabrir.
3. Identifique integrações de WhatsApp, pós-evento, álbum e impressão.
4. Leia [acesso-storage-e-selecao.md](references/acesso-storage-e-selecao.md).
5. Preserve uploads e seleções legadas; não apague arquivos sem autorização explícita.

## Modele a galeria

- Guarde tenant/owner, título, cliente opcional, evento opcional, token/slug, estado e expiração.
- Modele limite como quantidade inteira ou ilimitado, registrando a origem contratual.
- Grave foto com identidade estável, nome original, ordem, hash, dimensões e caminhos dos derivados.
- Separe capa, destaque e foto comum por atributos; não dependa da posição para representar capa.
- Use unicidade que impeça reprocessar o mesmo upload sem bloquear arquivos distintos de mesmo nome.

## Proteja acesso público

- Use token aleatório opaco e, se necessário, senha com hash forte.
- Resolva tenant e galeria pelo token; nunca confie em tenant vindo do request público.
- Restrinja downloads e originais por permissão server-side.
- Expiração bloqueia acesso, mas não apaga armazenamento automaticamente.
- Aplique rate limit a login público, tentativas de senha e endpoints de seleção.
- Não exponha caminhos físicos, metadados GPS ou listagem de diretório.

## Processe imagens sem tocar no original

1. Valide extensão, MIME real, tamanho, dimensões e conteúdo decodificável.
2. Persista o original em caminho tenant-scoped fora de enumeração direta.
3. Gere thumbnail e preview otimizados em job ou pipeline resiliente.
4. Aplique marca d'água somente no derivado de prova.
5. Corrija orientação conforme EXIF e remova metadados dos derivados públicos.
6. Registre estado por arquivo para retomar lotes parcialmente processados.

## Implemente seleção concorrente

- Faça selecionar/desmarcar por endpoint idempotente.
- Conte escolhas e aplique o limite dentro de transação/lock ou constraint adequada.
- Retorne total atual e limite para a interface reconciliar otimismos.
- Ao finalizar, congele um snapshot ordenado com arquivos/IDs e horário.
- Recuse novas alterações depois da finalização.
- Permita reabertura apenas a perfil autorizado, com motivo e auditoria; preserve a versão anterior.
- Em integrações, processe `selection.finalized` mais de uma vez sem duplicar etapas ou pedidos.

## Entregue a experiência do fotógrafo e do cliente

- No admin, permita upload por arrastar, progresso por arquivo, retry e reordenação sem reload.
- Deixe cliente, evento, acesso e prazo no mesmo contexto operacional.
- No público, mostre contador como `7 de 10`, bloqueie nova escolha no limite e mantenha boa navegação móvel.
- Ofereça mensagem pronta e envio por integração, mas preserve copiar/enviar manualmente quando o provedor falhar.
- Exporte a seleção por nomes e IDs; gere ZIP somente sob demanda e com URL temporária.

## Valide

- Teste arquivo inválido, duplicado, upload parcial, retry e sessão expirada.
- Teste limite 0, 1, exato, ilimitado e duas seleções simultâneas no último slot.
- Teste finalizar duas vezes, editar após finalizar, reabrir e finalizar nova versão.
- Teste expiração, senha errada, token inválido e acesso cruzado.
- Confirme que original não recebeu marca d'água nem alteração.
- Teste webhook/evento repetido para pós-evento e produção.
- Teste desktop, celular, teclado e conexões lentas.

## Critérios de conclusão

Considere pronto quando o limite é garantido no servidor sob concorrência, originais permanecem íntegros e cada finalização gera um snapshot auditável e idempotente para os próximos fluxos.
