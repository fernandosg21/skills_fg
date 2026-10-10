---
name: vlog-lara
description: Estrutura, estilo e fluxo técnico dos vlogs da Lara (viagens e passeios em família, 16:9, selfie falando, poucos cortes, inserts animados em papel rasgado). Use sempre que o usuário pedir para montar, planejar ou editar um vídeo da Lara (pastas "Video N" em A:/2026/Vídeos Lara), decidir onde entram inserts/B-roll, fazer prévias de inserts ou manter o padrão dos vlogs anteriores (Beto Carrero, Refúgio Paraíso Resort, Planetário, Viagem misteriosa).
---

# Vlog da Lara: estrutura, estilo e fluxo

Padrão aprendido dos vídeos finalizados em `A:/2026/Vídeos Lara` (Beto Carrero, Refúgio Paraíso Resort, Planetário) e do Vídeo 4 (Viagem misteriosa), montado com Remotion. Idioma: português do Brasil.

Implementação de referência completa: `A:/2026/Vídeos Lara/viagem-misteriosa/` (ver `LEIA-ME.md` lá). Padrões de código: `references/remotion-padroes.md`.

## Regras de ouro

1. **Nunca mexer nos originais.** Copiar para `originais/` do projeto; normalizar em `projeto/public/clips/`.
2. **Mostrar antes de montar.** Roteiro/plano de cenas e inserts para aprovação; depois prévia dos inserts; só então o vídeo completo.
3. **Não inventar.** Lugares, nomes, preços e falas só se a Lara disse ou o usuário confirmou. Textos na tela sem emojis e sem travessão.
4. **Não gastar nem baixar sem autorização.** Cada download (foto, música) precisa de ok explícito, com arquivo, fonte e tamanho.
5. **Transcrição real é a fonte dos tempos.** Nunca presumir onde a fala começa ou termina; medir no áudio.

## Formato

- 16:9, 1920x1080, 30 fps. Sem legenda (pedido fixo).
- Duração livre: a Lara prefere **o mínimo de cortes** e não se importa com vídeo longo (5 a 21 min).
- **Música:** o usuário insere manualmente depois. Entregar o MP4 com o áudio original limpo, sem trilha. (Se algum dia a música vier pelo projeto: só faixas do YouTube Music, fornecidas por eles; nunca baixar.)

## Anatomia do vlog

1. **Abertura (selfie):** "Oi gente, tudo bem com vocês? Hoje eu estou aqui..." e o lugar. Às vezes gancho ("Qual lugar você acha que é? Coloca nos comentários").
2. **Apresentação:** quem vem junto (mãe, namorado, madrinha, prima) e uma pergunta curta ("quais as suas expectativas?").
3. **Corpo:** tomadas inteiras dela falando; planos sem fala (janela, comida, ambiente) entre elas.
4. **Encerramento (selfie):** "Espero que tenham gostado, deixa o like, se inscreve no canal, tchau tchau, beijão."

## Cortes e transições (aprovado no Vídeo 4)

- **Tomadas inteiras.** Não cortar pausas dentro da fala; só aparar trechos longos sem fala (janela de avião à noite etc.).
- **Fade (dissolvido de imagem e áudio) só quando muda o ambiente** (aeroporto para avião, voo para chegada, rua do hotel). 0,8 s entre blocos grandes, 0,5 s nos demais. Abertura com fade de entrada, final com fade de saída.
- **Demais pontos: corte seco** com micro-fade de áudio de 3 frames, para não estalar nem cortar palavra.
- Nunca colocar emenda no meio da fala. Antes de cortar, medir o nível (RMS em janelas de 0,1 s): fala fica entre -10 e -20 dBFS; pausa entre -24 e -30 dBFS (após loudnorm).

## Inserts (estilo aprovado)

Gatilho: o insert entra quando ela fala do assunto (alinhar ao início real da frase, medido no áudio) e sai quando a frase termina. Nunca cobrir o rosto dela nem de quem fala junto; conferir em quadros reais.

Estilo: **papel rasgado** (borda irregular, textura de papel, fita adesiva, sombra) com **fotos realistas** por dentro, mais animação de entrada com mola. Paleta: marinho `#0B1B3A`, dourado `#FFC83D`, vermelho `#E63946`, azul `#2B59C3`, branco. Fonte: Arial Black.

Repertório usado no Vídeo 4 (reaproveitar e adaptar ao tema):
- **Título** em papel rasgado com fita, letras subindo, avião na trilha tracejada.
- **Caixa de comentário do YouTube** digitando a pergunta ("Comenta aqui", "Já comentou?") quando ela pede palpites.
- **Carimbo** batendo sobre foto real (passaporte) com flash e tremida, para dicas.
- **Cartão de embarque** em papel com canhoto destacado ("DE BRASIL, PARA ?").
- **Mapa real** em papel rasgado com rota a caneta; em vídeo de mistério, a rota some no rasgo com "?".
- **Corte de apoio em moldura de janela de avião**, com a voz dela continuando por cima.
- **Revelação:** "?" pulsante, cortina tricolor, nome do lugar em letras que caem, foto real do ponto turístico em papel rasgado, confete nas cores do país.

Fotos realistas: preferir **Pexels/Unsplash** (licença permite uso comercial e YouTube, sem crédito obrigatório). Listar candidatas (link, tamanho) e pedir ok antes de baixar. Registrar em `assets/CREDITOS.md`. Evitar foto noturna iluminada da torre Eiffel (iluminação tem direito autoral).

## Vídeo de mistério (destino secreto)

- A revelação é falada pela Lara; o insert só acompanha.
- Antes dela, revisar quadro a quadro telas de voo, placas, logos e mapas. Mapas não mostram o continente de destino.

## Prévia dos inserts

- Composição `Previa` que junta janelas do vídeo completo (sem render do vídeo todo).
- **Janelas começam e terminam em cena inteira ou em pausa medida da fala** (a primeira prévia cortou palavras e o usuário reclamou).
- Renderizar em 1080p e reduzir com ffmpeg (`--scale` fracionário falha com dimensão não inteira).
- Para enviar ao celular, gerar cópia abaixo de 30 MB (960x540, crf 28).

## Fluxo de trabalho para um novo vídeo

1. **Inventário:** `ffprobe` de cada clipe (duração, resolução, fps, áudio, `stream_side_data=rotation`). A pasta pode vir em `.zip` e em subpasta com o nome do contato.
2. **Fala da Lara existe?** Transcrever (faster-whisper medium). Se não houver fala, parar e perguntar (o Vídeo 3, só com cenas de terceiros, foi cancelado).
3. **Ver o material:** grades de quadros por clipe (`fps=1/5,scale=200:-1,tile=10x3`).
4. **Roteiro** (`roteiro.md`): cenas em ordem cronológica (IMG_xxxx crescente; arquivos de nome longo/remux entram pela fala), fala transcrita, trechos aparados, inserts e pendências. Aprovar.
5. **Normalizar** (`normalizar.sh`): orientação, 1920x1080, 30 fps, AAC 48 kHz, `loudnorm=I=-16:TP=-1.5:LRA=11` só nas cenas com fala.
6. **Montar no Remotion**, quadros-chave (`remotion still`) para checar inserts, **prévia**, aprovação, render final em `entregas/`.

## Armadilhas técnicas

- **Rotação:** clipes com rotação -90 podem sair em pé com a imagem deitada. Testar um quadro com e sem `-noautorotate`; no Vídeo 4, um precisou de `-noautorotate` + `hflip,vflip` e outro só `-noautorotate`. Conferir cada um.
- **Whisper:** PyAV instalado não aceita `metadata_errors`; extrair áudio com ffmpeg (`-map 0:a:0 -ac 1 -ar 16000 -f f32le -`) e passar o array numpy. Gravar JSON com `encoding='utf-8'`. Whisper alucina em áudio sem fala.
- **Render longo** (7 min levou cerca de 40 min): rodar em segundo plano com marcador de término; usar `--concurrency=4`. Uma falha `ERR_NETWORK_CHANGED` é rede, basta repetir.
- **Objetos JS com chaves "01", "10":** chaves numéricas são reordenadas; usar arrays para a ordem das cenas.
- Remotion 4.0.x: `OffthreadVideo` com `volume` em função de frame; animação só por `useCurrentFrame`/`interpolate`/`spring` (nada de CSS animation).

## Registro de vídeos

| Vídeo | Tipo | Duração | Observações |
|---|---|---|---|
| 1 Beto Carrero | parque, selfie + inserts | 21,5 min | logo do parque como adesivo, thumb própria, mãe participa |
| 2 Refúgio Paraíso Resort | hotel/resort, selfie + inserts | 5,2 min | 4K, mãe e namorado, tour (recepção, quarto, piscina, buffet) |
| Planetário V1 | museu/planetário, selfie + inserts | 10,4 min | gancho "qual lugar?", som da apresentação em primeiro plano |
| 3 Fomos em BC | bondinho e roda-gigante | cancelado | só clipes de terceiros, sem fala dela |
| 4 Viagem misteriosa | destino secreto (Paris), aeroporto e voo | cerca de 7 min | prévia V04 de inserts em papel rasgado entregue; render final pendente de aprovação |

Atualizar esta tabela a cada vídeo concluído.
