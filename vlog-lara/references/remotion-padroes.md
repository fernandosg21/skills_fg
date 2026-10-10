# Padrões de Remotion dos vlogs da Lara

Base pronta em `assets/remotion-base/` (cópia do projeto do Vídeo 4). Para um vídeo novo: copiar a pasta para `<projeto>/projeto/`, rodar `npm i`, ajustar `normalizar.sh`, `src/scenes.ts` e os inserts em `src/Video.tsx`.

## Arquivos

| Arquivo | Papel |
|---|---|
| `normalizar.sh` | ffmpeg: originais para `public/clips/NN.mp4` (orientação, 1920x1080, 30 fps, AAC, loudnorm na fala). Função `enc <id> <arquivo> <inicio> <duracao> <vf> <af> [pre]` |
| `src/scenes.ts` | Lista ordenada de cenas `S(id, duracao, xf)`. `xf` = frames de dissolvido com a anterior (0 = corte seco). Calcula `PLACED` (início com sobreposição) e `TOTAL_FRAMES` |
| `src/Video.tsx` | Composição principal: cada cena é `OffthreadVideo` com opacidade e volume em rampa. `OVERLAYS` (inserts por cena, em segundos locais), `CUTAWAYS` (imagem de apoio com a voz continuando), `PREVIEW_WINDOWS` e composição `Previa` |
| `src/inserts.tsx` | Componentes de insert: `TitleCard`, `CommentBox`, `Stamp`, `BoardingPass`, `MysteryMap`, `WindowFrame`, `BigQuestion`, `Reveal` |
| `src/paper.tsx` | `TornPaper` (papel rasgado com textura, fita, sombra; `tear` abre rasgo num canto), `Tape`, `tornPolygon` |

## Comandos

```bash
cd projeto
npx tsc --noEmit -p .
npx remotion still src/index.ts ViagemMisteriosa ../entregas/q.png --frame=<n>
npx remotion render src/index.ts Previa ../entregas/previa.mp4 --codec=h264 --audio-codec=aac --crf=20 --concurrency=4
npx remotion render src/index.ts ViagemMisteriosa ../entregas/<nome>-final.mp4 --codec=h264 --audio-codec=aac --crf=18 --concurrency=4
```

Render longo em segundo plano com marcador:

```bash
nohup bash -c 'npx remotion render ... > ../entregas/render.log 2>&1; echo "exit=$?" > ../entregas/render.done' &
```

## Medir pausas de fala (para emendas e para alinhar inserts)

```python
# áudio: ffmpeg -i clip.mp4 -vn -ac 1 -ar 16000 clip.wav
import wave, numpy as np
w = wave.open('clip.wav'); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16) / 32768
def db(t, half=0.05):
    x = a[int((t - half) * 16000):int((t + half) * 16000)]
    return 20 * np.log10(max(1e-5, np.sqrt(np.mean(x ** 2))))
# fala: -10 a -20 dBFS; pausa: -24 a -30 dBFS (após loudnorm)
```

## Achar o frame global de um momento

Início da cena em `PLACED` (`scenes.ts`) + segundos locais x 30. Cuidado: ao recalcular fora do TypeScript, usar array ordenado (objetos JS reordenam chaves como "10").
