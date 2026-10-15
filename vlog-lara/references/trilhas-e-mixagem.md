# Trilhas e mixagem

Leia quando o pedido incluir música, recomendação de faixas ou continuação do formato musicado aprovado.

## Autorização e procedência

O usuário passou a autorizar trilhas nos vídeos, inclusive download direto do compositor e biblioteca de músicas no Drive. Essa orientação supera a antiga entrega obrigatoriamente sem trilha. Para um novo pedido, seguir o escopo vigente: aprovação de um formato seguida de “faça nos demais” autoriza a continuidade correspondente; não repetir aprovações já dadas nem ampliar para compras ou novas publicações.

Presença no catálogo do YouTube Music serve para localizar/recomendar a faixa; não concede licença de sincronização nem autoriza extrair áudio da plataforma. Usar arquivos fornecidos pelo usuário ou obtidos de fonte oficial com licença compatível e autorização vigente. Para downloads autorizados em lote, registrar fontes, tamanhos e licenças sem exigir nova confirmação por arquivo. Se o download não estiver autorizado, preparar a seleção antes de pedir a informação/autorização faltante.

Neste lote, arquivos oficiais de Kevin MacLeod no Incompetech foram verificados sob CC BY 4.0 e exigem atribuição. Conferir a licença e a versão na fonte antes de um novo download; reutilizar os arquivos locais já verificados quando autorizado. Guardar URL, título, compositor, licença, data, hash, tamanho e duração no manifesto da biblioteca. Não presumir que qualquer música do mesmo compositor tem a mesma licença.

Créditos devem listar apenas as faixas efetivamente usadas em cada vídeo, autor, fonte, licença e alterações pertinentes (cortes, fades, mixagem). Entregar o texto ao usuário para a descrição do YouTube. Se a pasta da cliente deve conter apenas vídeo e capa, guardar créditos na produção e fornecer seu acesso ao usuário.

## Seleção e posicionamento

| Exemplo usado | Contexto que funcionou |
|---|---|
| Carefree | Viagem, passagem de ambiente e revelação alegre |
| Bossa Antigua | Hotel, café da manhã, passeio tranquilo |
| Sneaky Snitch | Suspense divertido de Caixas Misteriosas |
| Life of Riley | Trechos alegres da Disney |
| Dream Culture | Museu, igreja e contemplação |

São referências de clima, não uma obrigação de repetir faixas. Mapear entradas/saídas pela transcrição e pelos tempos da edição aprovada. Usar música pontual em aberturas, passagens, paisagens e encerramentos, com fades; evitar uma cama contínua por todo o vlog.

Preservar o som relevante: explicações de guias/igrejas, demonstrações sonoras de aparelhos em Caixas, falas de atrações e shows da Disney. Não sobrepor outra música nesses trechos. Não atenuar falas para abrir espaço à trilha.

## Mixagem sem alterar a montagem

Partir do final com cores aprovadas e copiar o fluxo de vídeo. Manter a voz original sem novos recortes, limpeza ou retiming. Aplicar ducking suave na música sob a fala; atenuar ambiente apenas onde houver necessidade e sem esconder conteúdo relevante.

No lote funcionaram música cerca de 16 dB abaixo da voz e, conforme a cena, RMS da trilha em torno de -34 a -37 dBFS sob diálogo e -23,5 a -32 dBFS em ambiente. Lookahead de 100 ms e release de 350 ms foram referências de automação. Esses números descrevem o mix testado: medir a voz e ouvir o resultado, em vez de impor um ganho universal.

Controlar picos sem ganho automático que aumente todo o mix e sem deslocar a fala. A configuração FFmpeg `alimiter=limit=0.92:level=false:latency=true:attack=5:release=60` funcionou neste lote; conferir a disponibilidade/opções na versão instalada e o resultado real antes de reutilizar. Validar sincronismo e ataques/fades após codificar em AAC, além do pico numérico.

Para longos, estimar espaço e processar áudio em blocos ou memmap; não carregar todos os canais do episódio inteiro sem necessidade. Remover somente temporários próprios depois de validar o final. Preservar fontes, planos e relatórios.

Verificações de vídeo/áudio e limites da conclusão estão em [cor-e-preservacao.md](cor-e-preservacao.md). Implementações locais: `viagem-misteriosa/mixar-trilha-v01.py`, `verificar-trilha-v01.py`, `.trilhas-demais-v01/produzir.py`; biblioteca e créditos em `Musicas Lara/`. Não executar planos antigos automaticamente em uma nova edição.
