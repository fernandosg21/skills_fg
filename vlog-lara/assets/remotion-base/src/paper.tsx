import React from 'react';
import {random} from 'remotion';

// Textura de papel (ruído fractal), embutida como SVG.
const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.42  0 0 0 0 0.37  0 0 0 0 0.28  0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Polígono de borda rasgada (em px) para clip-path. `tear` abre um rasgo grande num canto. */
export const tornPolygon = (w: number, h: number, seed: string, amp = 9, step = 13, tear?: 'tr' | 'tl' | 'br' | 'bl') => {
  const r = (k: string) => random(`${seed}-${k}`);
  const pts: [number, number][] = [];
  const jag = (k: string) => r(k) * amp + (r(k + 'd') > 0.93 ? amp * 1.2 : 0);
  for (let x = 0; x <= w; x += step) pts.push([x, jag(`t${x}`)]);
  for (let y = step; y <= h; y += step) pts.push([w - jag(`r${y}`), y]);
  for (let x = w - step; x >= 0; x -= step) pts.push([x, h - jag(`b${x}`)]);
  for (let y = h - step; y > 0; y -= step) pts.push([jag(`l${y}`), y]);
  let out = pts;
  if (tear) {
    // remove um canto em diagonal irregular
    const cx = tear.includes('r') ? w : 0;
    const cy = tear.includes('b') ? h : 0;
    const size = Math.min(w, h) * 0.42;
    out = pts.map(([x, y]) => {
      const d = Math.abs(x - cx) + Math.abs(y - cy);
      if (d < size) {
        const k = (size - d) / size;
        const wob = (r(`tear${Math.round(x)}${Math.round(y)}`) - 0.5) * 14;
        return [x + (cx === 0 ? 1 : -1) * k * size * 0.5 + wob, y + (cy === 0 ? 1 : -1) * k * size * 0.5 + wob] as [number, number];
      }
      return [x, y];
    });
  }
  return `polygon(${out.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
};

/** Fita adesiva semitransparente. */
export const Tape: React.FC<{x: number; y: number; w?: number; rot: number}> = ({x, y, w = 120, rot}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: 38,
      transform: `rotate(${rot}deg)`,
      background: 'linear-gradient(180deg, rgba(250,244,220,0.78), rgba(235,226,196,0.7))',
      backgroundImage: NOISE,
      backgroundColor: 'rgba(245,238,210,0.72)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      clipPath: tornPolygon(w, 38, `tape${x}${y}`, 3, 6),
      zIndex: 3,
    }}
  />
);

/**
 * Pedaço de papel rasgado: borda branca fibrosa com textura, conteúdo (foto ou texto) por dentro,
 * sombra que respeita o recorte.
 */
export const TornPaper: React.FC<{
  w: number;
  h: number;
  seed: string;
  pad?: number;
  color?: string;
  tear?: 'tr' | 'tl' | 'br' | 'bl';
  tapes?: {x: number; y: number; w?: number; rot: number}[];
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({w, h, seed, pad = 16, color = '#FBF7EE', tear, tapes = [], style, children}) => (
  <div style={{position: 'relative', width: w, height: h, ...style}}>
    <div style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.45)) drop-shadow(0 2px 3px rgba(0,0,0,0.3))'}}>
      <div style={{position: 'absolute', inset: 0, clipPath: tornPolygon(w, h, seed, 10, 12, tear), backgroundColor: color, backgroundImage: NOISE}}>
        <div
          style={{
            position: 'absolute',
            inset: pad,
            overflow: 'hidden',
            clipPath: tornPolygon(w - pad * 2, h - pad * 2, seed + 'in', 4, 9, tear),
          }}
        >
          {children}
          {/* leve granulação de papel por cima do conteúdo */}
          <div style={{position: 'absolute', inset: 0, backgroundImage: NOISE, mixBlendMode: 'multiply', opacity: 0.55}} />
        </div>
      </div>
    </div>
    {tapes.map((t, i) => (
      <Tape key={i} {...t} />
    ))}
  </div>
);

export const PAPER_NOISE = NOISE;
