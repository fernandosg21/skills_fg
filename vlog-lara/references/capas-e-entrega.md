# Capas e entrega no Drive

## Capas e inserts

Gerar inserts no Codex com `image_gen` integrado; bancos de imagens somente por pedido do usuário. Copiar assets gerados para o projeto, junto com referências e prompts, sem depender apenas da pasta temporária de geração. Manter o estilo de papel rasgado e a voz original contínua.

Dar destaque real às imagens: verificar leitura no celular e usar enquadramento grande proporcional ao tema. No lote, imagens de aproximadamente 1335×860 em 1920×1080 com o vídeo original em janela lateral de 460×259 funcionaram como composição; ajustar por cena para não cobrir rostos, textos e detalhes. O tamanho pequeno da base antiga não é o padrão aprovado. Inserts laterais menores continuam possíveis quando forem legíveis e adequados ao conteúdo.

Capa: 16:9, final JPEG 1920×1080, alegre, com título curto e forte, legível no celular. Mostrar Lara e o local real do episódio. Preferir quadro real dela olhando para a câmera e sorrindo; quando não existir e a criação estiver autorizada, gerar a pose usando referências reais e preservando sua identidade. Inspecionar as referências antes da edição. Guardar quadro, prompt e imagem nativa; conversão de formato/resolução é preparação da entrega.

Preservar tons de pele e não inventar aparência do estabelecimento, preços, avaliações ou acontecimentos. Na Viagem Misteriosa, a capa e os inserts anteriores à revelação também devem respeitar o destino secreto. Reaproveitar capas já aprovadas quando a tarefa for apenas cor ou trilha.

## Identificar o final antes de enviar

Usar o arquivo fechado e validado em `entregas/`, com tamanho/hash local e edição identificada. Não escolher por nome, data ou tamanho isoladamente. Conferir quais fontes estão completas; render concluído ou nome limpo não significa material original completo. Registrar faltas/incompletos separadamente e não ocultá-los na passagem ao usuário.

Preferir ferramentas conectadas do Drive para busca, metadados, renomear e mover. Conferir capacidade atual de upload: para MP4s grandes além do limite da ferramenta, usar o navegador e o upload nativo de **nova versão** a partir do arquivo validado. Seguir a skill de navegador vigente. Substituir o mesmo ID quando solicitado, preservando link e histórico.

Não escrever diretamente no cache DriveFS nem truncar/reconciliar arquivos sincronizados para forçar upload. Houve operações locais interrompidas ou com erro que se aplicaram depois e substituíram a nuvem por conteúdo incompleto. Uma cópia em unidade sincronizada não comprova envio. Não apagar cache para contornar conflito; usar uma fonte local íntegra e o mecanismo suportado de nova versão, depois verificar a revisão atual.

## Verificação remota

Depois do envio, confirmar ID, nome, tamanho, MIME, pasta pai, permissões/compartilhamento e `can_download`. Quando disponível, confirmar revisão atual e `originalFilename` correspondente à fonte validada. Se houver sincronização anterior pendente, verificar novamente após ela estabilizar para detectar um upload tardio substituindo o final correto.

Tamanho igual não prova integridade: arquivos pré-alocados podem conter dados incompletos. Usar checksum remoto ou comparação por download quando disponíveis e proporcionais; se não houver checksum remoto, declarar qual evidência existe. Identificar separadamente arquivo enviado, download disponível e processamento/reprodução no player. Não declarar revisão integral no player só por metadados corretos.

Mover para uma pasta compartilhada pode ampliar o acesso por herança mesmo sem mudar a permissão da pasta. Conferir origem e destino e respeitar a autorização atual de entrega à cliente. Não presumir autorização para compartilhar publicamente um novo lote; não alegar privacidade inalterada se arquivos privados passaram a herdar leitura por link.

## Pasta para a cliente

Quando o pedido for uma pasta pronta para encaminhar, manter apenas pares de final e capa, com a sequência dos projetos. Exemplo: `Vídeo 04 - Viagem Misteriosa.mp4` e `Vídeo 04 - Viagem Misteriosa - Capa.jpg`. Retirar do nome termos técnicos/versões internas sem apagar a identificação nas evidências de produção.

Mover prévias, créditos, músicas, relatórios e versões de apoio para uma área de produção fora da pasta da cliente, com acesso apropriado. Preferir movimentação reversível a exclusão. Preservar originais, masters, histórico e fontes geradas. Produzir inventário antes/depois com IDs; verificar os pares, tipos de arquivo, duplicatas, bytes e acesso. A quantidade é a do lote vigente, nunca um número fixo na skill.

Registros mutáveis de entrega e links ficam na ficha do projeto no Obsidian e nos recibos locais. Referências deste lote: `.organizacao-cliente-2026-10-15/confirmado.json`, `.trilhas-demais-v01/auditoria-online-final.json` e `ENTREGA-PARA-CLIENTE.md`, na raiz do projeto. São evidências datadas, não comandos para novos uploads. Informar quantidade de vídeos e capas efetivamente confirmados ao concluir uma entrega.
