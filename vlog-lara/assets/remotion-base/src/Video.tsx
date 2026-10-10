import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FADE_IN_FIRST, FADE_OUT_LAST, FPS, PLACED, Placed, TOTAL_FRAMES} from './scenes';
import {BigQuestion, BoardingPass, CommentBox, MysteryMap, Reveal, Stamp, TitleCard, WindowFrame} from './inserts';

const sec = (s: number) => Math.round(s * FPS);
const MICRO = 3; // micro-fade de áudio nos cortes secos, para não estalar nem cortar a fala

type Overlay = {at: number; dur: number; node: (total: number) => React.ReactNode};
type Cutaway = {at: number; dur: number; clip: string; from: number};

// Inserts por cena (tempos em segundos locais da cena, conforme a fala transcrita).
const OVERLAYS: Record<string, Overlay[]> = {
  '01': [
    {at: 0.8, dur: 4.2, node: (t) => <TitleCard total={t} />},
    {at: 22.6, dur: 4.8, node: (t) => <CommentBox total={t} hint="COMENTA AQUI" lead="Eu acho que é " text="..." />},
  ],
  '04': [{at: 4.6, dur: 5.0, node: (t) => <CommentBox total={t} hint="JÁ COMENTOU?" lead="Para onde ela vai? " text="?" />}],
  '07': [{at: 19.3, dur: 4.6, node: (t) => <Stamp total={t} small="DICA" big="NÃO É NO BRASIL" />}],
  '08': [{at: 6.8, dur: 5.8, node: (t) => <BoardingPass total={t} title="EMBARQUE INTERNACIONAL" />}],
  '15': [{at: 2.0, dur: 13.0, node: (t) => <MysteryMap total={t} />}],
  '20': [
    {at: 9.0, dur: 6.0, node: (t) => <BigQuestion total={t} />},
    {at: 15.2, dur: 12.8, node: (t) => <Reveal total={t} franceAt={sec(21.4 - 15.2)} />},
  ],
};

// Cortes de apoio: imagem por cima, a voz da cena continua.
const CUTAWAYS: Record<string, Cutaway[]> = {
  // "Tão altas que estaremos nas alturas daqui duas horas. Nosso próximo voo."
  '07': [{at: 40.6, dur: 6.8, clip: '05', from: 15}],
};

const CutawayLayer: React.FC<{c: Cutaway}> = ({c}) => (
  <WindowFrame total={sec(c.dur)}>
    <OffthreadVideo src={staticFile(`clips/${c.clip}.mp4`)} startFrom={sec(c.from)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </WindowFrame>
);

const Scene: React.FC<{p: Placed; first: boolean; last: boolean}> = ({p, first, last}) => {
  const frame = useCurrentFrame();
  let opacity = 1;
  if (p.xf > 0) opacity = interpolate(frame, [0, p.xf], [0, 1], {extrapolateRight: 'clamp'});
  if (first) opacity = interpolate(frame, [0, FADE_IN_FIRST], [0, 1], {extrapolateRight: 'clamp'});
  if (last) opacity = Math.min(opacity, interpolate(frame, [p.len - FADE_OUT_LAST, p.len], [1, 0], {extrapolateLeft: 'clamp'}));

  // áudio: rampa de entrada/saída (longa no dissolvido, curta no corte seco)
  const volume = (f: number) => {
    const inLen = p.xf > 0 ? p.xf : first ? FADE_IN_FIRST : MICRO;
    const outLen = last ? FADE_OUT_LAST : p.xfOut > 0 ? p.xfOut : MICRO;
    return Math.min(interpolate(f, [0, inLen], [0, 1], {extrapolateRight: 'clamp'}), interpolate(f, [p.len - outLen, p.len], [1, 0], {extrapolateLeft: 'clamp'}));
  };

  return (
    <AbsoluteFill style={{opacity, backgroundColor: '#000'}}>
      <OffthreadVideo src={staticFile(`clips/${p.id}.mp4`)} volume={volume} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      {(CUTAWAYS[p.id] ?? []).map((c, i) => (
        <Sequence key={`c${i}`} from={sec(c.at)} durationInFrames={sec(c.dur)}>
          <CutawayLayer c={c} />
        </Sequence>
      ))}
      {(OVERLAYS[p.id] ?? []).map((o, i) => (
        <Sequence key={`o${i}`} from={sec(o.at)} durationInFrames={sec(o.dur)}>
          {o.node(sec(o.dur))}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const ViagemMisteriosa: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    {PLACED.map((p, i) => (
      <Sequence key={p.id} from={p.start} durationInFrames={p.len}>
        <Scene p={p} first={i === 0} last={i === PLACED.length - 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

// Prévia: junta janelas do vídeo (início, duração em frames, em frames do vídeo completo).
export type Win = {a: number; b: number};
export const PREVIEW_WINDOWS: Win[] = (() => {
  const g = (id: string, s: number) => PLACED.find((p) => p.id === id)!.start + sec(s);
  // Emendas só em cena inteira ou em pausas da fala (medidas no áudio), para não cortar palavra.
  return [
    {a: g('01', 0), b: g('01', 27.6)}, // título e comentário
    {a: g('04', 0), b: g('05', 4)}, // já comentou e fade aeroporto para avião
    {a: g('07', 18.9), b: g('07', 29.4)}, // carimbo
    {a: g('07', 40.0), b: g('07', 48.6)}, // janela do avião
    {a: g('08', 0), b: g('08', 18.5)}, // cartão de embarque
    {a: g('15', 0), b: g('15', 16)}, // mapa
    {a: g('20', 0), b: g('20', 31.3)}, // revelação
  ];
})();
export const PREVIEW_FRAMES = PREVIEW_WINDOWS.reduce((n, w) => n + (w.b - w.a), 0);

export const Previa: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {PREVIEW_WINDOWS.map((w, i) => {
        const from = at;
        at += w.b - w.a;
        return (
          <Sequence key={i} from={from} durationInFrames={w.b - w.a}>
            <Sequence from={-w.a} durationInFrames={TOTAL_FRAMES}>
              <ViagemMisteriosa />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
