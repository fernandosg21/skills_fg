// Cenas na ordem do roteiro. Durações reais dos clipes normalizados (ffprobe), em segundos.
// `xf` = frames de dissolvido (imagem e áudio) com a cena anterior. Entre blocos o dissolvido é mais longo.
export const FPS = 30;
export const XF_SHORT = 15; // 0,5 s
export const XF_BLOCK = 24; // 0,8 s
export const FADE_IN_FIRST = 12;
export const FADE_OUT_LAST = 24;

export type SceneDef = {id: string; dur: number; xf: number};

const S = (id: string, dur: number, xf = 0): SceneDef => ({id, dur, xf});
const FADE = XF_SHORT;

// Dissolvido só quando muda o ambiente; nos demais pontos o corte é seco (com micro-fade de áudio).
export const SCENES: SceneDef[] = [
  S('01', 27.6),
  S('02', 14.8),
  S('04', 10.067),
  S('05', 25.94, XF_BLOCK), // aeroporto para avião
  S('06', 7.7),
  S('07', 62.7, XF_BLOCK), // avião para Guarulhos
  S('08', 18.5),
  S('09', 17.4),
  S('10', 34.1),
  S('11', 10.0),
  S('12', 7.145, FADE), // corredor para passarela
  S('13', 7.102, XF_BLOCK), // passarela para cabine
  S('14', 31.7),
  S('15', 28.0, FADE), // cabine para janela à noite
  S('16', 35.0),
  S('17', 17.534, FADE), // janela para refeição
  S('18', 12.478),
  S('19', 16.062, FADE), // amanhecer
  S('20', 31.3, XF_BLOCK), // chegada
  S('21', 11.2, FADE), // rua do hotel
];

export const frames = (s: SceneDef) => Math.round(s.dur * FPS);

export type Placed = SceneDef & {start: number; len: number; xfOut: number};

export const PLACED: Placed[] = (() => {
  const out: Placed[] = [];
  let end = 0;
  SCENES.forEach((s, i) => {
    const start = i === 0 ? 0 : end - s.xf;
    const len = frames(s);
    out.push({...s, start, len, xfOut: SCENES[i + 1]?.xf ?? 0});
    end = start + len;
  });
  return out;
})();

export const TOTAL_FRAMES = PLACED[PLACED.length - 1].start + PLACED[PLACED.length - 1].len;

export const sceneStart = (id: string) => {
  const p = PLACED.find((x) => x.id === id);
  if (!p) throw new Error(`cena ${id} não existe`);
  return p.start;
};
