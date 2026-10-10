import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {PAPER_NOISE, TornPaper} from './paper';

const FONT = "'Arial Black', 'Segoe UI Black', Arial, sans-serif";
const NAVY = '#0B1B3A';
const NAVY2 = '#14294F';
const GOLD = '#FFC83D';
const WHITE = '#FFFFFF';
const RED = '#E63946';
const BLUE = '#2B59C3';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const glass: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(11,27,58,0.78), rgba(20,41,79,0.62))',
  backdropFilter: 'blur(14px)',
  border: '2px solid rgba(255,255,255,0.28)',
  boxShadow: '0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
};
const shadow = '0 6px 24px rgba(0,0,0,0.6)';

// Ciclo de vida: entrada com mola e saída suave nos últimos 12 frames.
const useLife = (total: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 15, stiffness: 110}});
  const exit = interpolate(frame, [total - 12, total], [1, 0], clamp);
  return {frame, fps, enter, exit};
};

const PlaneIcon: React.FC<{size: number; color?: string}> = ({size, color = WHITE}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
  </svg>
);

const Sparkle: React.FC<{x: number; y: number; size: number; phase: number; frame: number; color?: string}> = ({x, y, size, phase, frame, color = GOLD}) => {
  const t = (Math.sin((frame + phase) / 6) + 1) / 2;
  return (
    <svg style={{position: 'absolute', left: x, top: y, opacity: 0.25 + 0.75 * t, transform: `scale(${0.5 + 0.7 * t}) rotate(${frame * 2}deg)`}} width={size} height={size} viewBox="-10 -10 20 20">
      <path d="M0,-10 L2.2,-2.2 L10,0 L2.2,2.2 L0,10 L-2.2,2.2 L-10,0 L-2.2,-2.2 Z" fill={color} />
    </svg>
  );
};

/** 1. Título: pedaço de papel rasgado colado com fita, letras subindo, avião na trilha. */
export const TitleCard: React.FC<{total: number}> = ({total}) => {
  const {frame, fps, enter, exit} = useLife(total);
  const word = 'MISTERIOSA';
  const planeX = interpolate(frame, [10, total - 10], [-4, 100], {...clamp, easing: Easing.inOut(Easing.quad)});
  const q = spring({frame: frame - 34, fps, config: {damping: 8, stiffness: 140}});
  const drop = (1 - enter) * -260;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 26, opacity: exit}}>
      <TornPaper w={820} h={232} seed="title" pad={0} tapes={[{x: -26, y: -8, rot: -24}, {x: 724, y: -6, rot: 22}]} style={{transform: `translateY(${drop}px) rotate(${-2 + (1 - enter) * -8}deg)`}}>
        <div style={{position: 'absolute', inset: 0, padding: '22px 40px 0', textAlign: 'center'}}>
          <div style={{fontFamily: FONT, fontSize: 34, color: RED, letterSpacing: 22, marginRight: -22}}>VIAGEM</div>
          <div style={{display: 'flex', justifyContent: 'center', fontFamily: FONT, fontSize: 98, color: NAVY, lineHeight: 1.02}}>
            {word.split('').map((ch, i) => {
              const s = spring({frame: frame - 8 - i * 2.2, fps, config: {damping: 13, stiffness: 160}});
              return (
                <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - s) * 60}px) rotate(${(1 - s) * 10}deg)`, opacity: Math.min(1, s * 1.4)}}>{ch}</span>
              );
            })}
            <span style={{display: 'inline-block', color: RED, marginLeft: 8, transform: `scale(${q}) rotate(${(1 - q) * -30}deg)`}}>?</span>
          </div>
          <div style={{position: 'relative', height: 30, margin: '4px 30px 0'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 14, borderTop: `3px dashed ${NAVY}`, opacity: 0.55}} />
            <div style={{position: 'absolute', top: 1, left: `${planeX}%`, transform: 'translateX(-50%) rotate(90deg)'}}>
              <PlaneIcon size={28} color={RED} />
            </div>
          </div>
        </div>
      </TornPaper>
    </AbsoluteFill>
  );
};


/** 2 e 3. Caixa de comentário do YouTube: digitando a pergunta, com ícone de balão. */
export const CommentBox: React.FC<{total: number; lead: string; text: string; hint: string}> = ({total, lead, text, hint}) => {
  const {frame, enter, exit} = useLife(total);
  const typeStart = 14;
  const shown = Math.max(0, Math.floor((frame - typeStart) / 1.6));
  const full = lead + text;
  const typed = full.slice(0, shown);
  const done = shown >= full.length;
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  const bounce = Math.sin(frame / 5) * 6;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 60, opacity: exit}}>
      <div style={{width: 1000, transform: `translateY(${(1 - enter) * 160}px) scale(${0.9 + 0.1 * enter})`, opacity: Math.min(1, enter * 1.6)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, marginLeft: 8}}>
          <div style={{transform: `translateY(${bounce}px)`}}>
            <svg width={64} height={64} viewBox="0 0 24 24"><path fill={GOLD} d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><circle cx="8" cy="10.5" r="1.3" fill={NAVY} /><circle cx="12" cy="10.5" r="1.3" fill={NAVY} /><circle cx="16" cy="10.5" r="1.3" fill={NAVY} /></svg>
          </div>
          <div style={{fontFamily: FONT, fontSize: 36, color: WHITE, textShadow: shadow, letterSpacing: 2}}>{hint}</div>
        </div>
        <div style={{...glass, borderRadius: 22, padding: '22px 34px', display: 'flex', alignItems: 'center', gap: 24}}>
          <div style={{width: 62, height: 62, borderRadius: 31, background: `linear-gradient(135deg, ${GOLD}, #FF9A3D)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 34, color: NAVY}}>?</div>
          <div style={{fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 46, color: WHITE, borderBottom: '3px solid rgba(255,255,255,0.5)', flex: 1, paddingBottom: 6, minHeight: 56}}>
            {typed}
            <span style={{opacity: cursorOn && !done ? 1 : 0, color: GOLD}}>|</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 4. Foto real de passaporte em papel rasgado; o carimbo bate em cima, com flash e tremida. */
export const Stamp: React.FC<{total: number; small: string; big: string}> = ({total, small, big}) => {
  const {frame, enter, exit} = useLife(total);
  const hit = 16; // frame em que o carimbo bate
  const slam = interpolate(frame, [hit - 8, hit], [3.0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const stampOn = frame >= hit - 8 ? 1 : 0;
  const shake = frame >= hit && frame < hit + 8 ? Math.sin(frame * 7) * (hit + 8 - frame) * 0.9 : 0;
  const flash = interpolate(frame, [hit - 1, hit + 1, hit + 9], [0, 0.45, 0], clamp);
  const slide = (1 - enter) * 520;
  return (
    <AbsoluteFill style={{opacity: exit}}>
      <AbsoluteFill style={{background: WHITE, opacity: flash}} />
      <div style={{position: 'absolute', right: 50, top: 40, transform: `translate(${slide + shake}px, ${shake * 0.5}px) rotate(5deg)`}}>
        <TornPaper w={600} h={420} seed="passport" pad={14} tapes={[{x: 230, y: -14, w: 140, rot: -3}]}>
          <Img src={staticFile('img/pexels-4922356.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 55%', transform: 'scale(1.35)'}} />
        </TornPaper>
        {/* carimbo */}
        <div style={{position: 'absolute', left: 70, top: 150, transform: `rotate(-10deg) scale(${slam})`, opacity: stampOn, mixBlendMode: 'multiply'}}>
          <div style={{border: `7px double ${RED}`, borderRadius: 14, padding: '8px 22px 10px', textAlign: 'center', fontFamily: FONT, color: RED, background: 'rgba(255,255,255,0.18)', WebkitMaskImage: PAPER_NOISE.replace('0.22 0', '0.95 0'), maskImage: 'none'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 24, letterSpacing: 8}}>
              <PlaneIcon size={24} color={RED} />
              {small}
              <PlaneIcon size={24} color={RED} />
            </div>
            <div style={{fontSize: 52, lineHeight: 1.05}}>{big}</div>
            <div style={{fontSize: 16, letterSpacing: 5, borderTop: `3px solid ${RED}`, marginTop: 4, paddingTop: 3}}>VIAGEM MISTERIOSA</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};


/** 6. Cartão de embarque em papel rasgado (canhoto destacado), com picote e código de barras. */
export const BoardingPass: React.FC<{total: number; title: string}> = ({total, title}) => {
  const {frame, enter, exit} = useLife(total);
  const x = (1 - enter) * -760;
  const planeMove = interpolate(frame, [10, total - 10], [0, 92], clamp);
  const bars = Array.from({length: 30}, (_, i) => 2 + Math.floor(random(`bar${i}`) * 5));
  return (
    <AbsoluteFill style={{alignItems: 'flex-start', justifyContent: 'flex-end', padding: '0 0 50px 50px', opacity: exit}}>
      <div style={{display: 'flex', alignItems: 'center', transform: `translateX(${x}px) rotate(${-3 + (1 - enter) * -6}deg)`}}>
        <TornPaper w={730} h={236} seed="pass-main" pad={0} tapes={[{x: -30, y: 70, rot: -80}]}>
          <div style={{position: 'absolute', inset: 0, padding: '24px 40px 22px 54px', fontFamily: FONT, color: NAVY}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: 20, letterSpacing: 8, color: BLUE}}>CARTÃO DE EMBARQUE</div>
              <PlaneIcon size={30} color={BLUE} />
            </div>
            <div style={{fontSize: 46, lineHeight: 1.05, margin: '6px 0 8px'}}>{title}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <div><div style={{fontSize: 15, color: '#667'}}>DE</div><div style={{fontSize: 32}}>BRASIL</div></div>
              <div style={{flex: 1, position: 'relative', height: 30}}>
                <div style={{position: 'absolute', left: 0, right: 0, top: 14, borderTop: `3px dashed ${BLUE}`}} />
                <div style={{position: 'absolute', top: 2, left: `${planeMove}%`, transform: 'translateX(-50%) rotate(90deg)'}}><PlaneIcon size={26} color={BLUE} /></div>
              </div>
              <div><div style={{fontSize: 15, color: '#667'}}>PARA</div><div style={{fontSize: 32, color: RED}}>?</div></div>
            </div>
          </div>
        </TornPaper>
        <div style={{width: 0, height: 190, borderLeft: '4px dotted rgba(11,27,58,0.35)', margin: '0 2px'}} />
        <TornPaper w={190} h={230} seed="pass-stub" pad={0} color="#FFD25E" style={{transform: `rotate(${interpolate(frame, [20, 40], [0, 4], clamp)}deg) translateY(${interpolate(frame, [20, 40], [0, 8], clamp)}px)`}}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12}}>
            <div style={{display: 'flex', alignItems: 'flex-end', height: 90, gap: 2}}>
              {bars.map((w, i) => <div key={i} style={{width: w, height: 90, background: NAVY}} />)}
            </div>
            <div style={{fontFamily: FONT, fontSize: 14, color: NAVY, letterSpacing: 3}}>INTERNACIONAL</div>
          </div>
        </TornPaper>
      </div>
    </AbsoluteFill>
  );
};


/** 7. Foto real de mapa (América do Sul e África) em papel rasgado; rota a caneta some no rasgo com "?". */
export const MysteryMap: React.FC<{total: number}> = ({total}) => {
  const {frame, enter, exit} = useLife(total);
  const W = 680;
  const H = 460;
  const progress = interpolate(frame, [16, total - 34], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  // coordenadas dentro da foto (px no cartão): Brasil -> canto superior direito rasgado
  const P0 = {x: 290, y: 230};
  const C = {x: 420, y: 60};
  const P1 = {x: 690, y: -20};
  const at = (t: number) => ({x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * C.x + t * t * P1.x, y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * C.y + t * t * P1.y});
  const pos = at(Math.min(progress, 0.86));
  const ahead = at(Math.min(progress, 0.86) + 0.02);
  const angle = (Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180) / Math.PI;
  const len = 560;
  const ringT = (frame % 36) / 36;
  const q = interpolate(progress, [0.8, 1], [0, 1], clamp);
  return (
    <AbsoluteFill style={{opacity: exit}}>
      <div style={{position: 'absolute', left: 50, bottom: 40, transform: `translateY(${(1 - enter) * 600}px) rotate(${-4 + (1 - enter) * 10}deg)`}}>
        <TornPaper w={W} h={H} seed="map" pad={14} tear="tr" tapes={[{x: 40, y: -16, w: 130, rot: -12}, {x: 250, y: H - 24, w: 130, rot: 6}]}>
          <Img src={staticFile('img/pexels-4133684.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '30% 50%', transform: 'scale(1.25)', transformOrigin: '30% 50%'}} />
        </TornPaper>
        <svg width={W + 80} height={H + 80} viewBox={`0 0 ${W + 80} ${H + 80}`} style={{position: 'absolute', left: 0, top: -40, overflow: 'visible'}}>
          <g transform="translate(0 40)">
            <path d={`M${P0.x},${P0.y} Q${C.x},${C.y} ${P1.x},${P1.y}`} stroke={RED} strokeWidth={6} strokeLinecap="round" strokeDasharray="14 10" fill="none" opacity={0.9} pathLength={len} style={{strokeDashoffset: 0}} mask="url(#reveal)" />
            <mask id="reveal">
              <path d={`M${P0.x},${P0.y} Q${C.x},${C.y} ${P1.x},${P1.y}`} stroke="#fff" strokeWidth={14} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
            </mask>
            <circle cx={P0.x} cy={P0.y} r={11} fill={RED} stroke={WHITE} strokeWidth={3} />
            <circle cx={P0.x} cy={P0.y} r={11 + ringT * 22} fill="none" stroke={RED} strokeWidth={3} opacity={1 - ringT} />
            <g transform={`translate(${pos.x} ${pos.y}) rotate(${angle + 90})`} opacity={progress < 0.86 ? 1 : interpolate(progress, [0.86, 0.95], [1, 0], clamp)}>
              <g transform="translate(-22 -22)"><PlaneIcon size={44} color={NAVY} /></g>
            </g>
            <g transform={`translate(${W - 40} ${10}) scale(${q})`}>
              <circle r={44 + ringT * 26} fill="none" stroke={GOLD} strokeWidth={4} opacity={1 - ringT} />
              <circle r={44} fill={NAVY} stroke={GOLD} strokeWidth={5} />
              <text y={22} fontFamily={FONT} fontSize={64} fill={GOLD} textAnchor="middle">?</text>
            </g>
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};


/** Moldura de janela de avião para o corte de apoio (usada no layer do Video.tsx). */
export const WindowFrame: React.FC<{children: React.ReactNode; total: number}> = ({children, total}) => {
  const frame = useCurrentFrame();
  const inn = interpolate(frame, [0, 14], [0, 1], clamp);
  const out = interpolate(frame, [total - 14, total], [1, 0], clamp);
  const o = Math.min(inn, out);
  const s = interpolate(frame, [0, total], [0.94, 1.0]);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(11,27,58,0.82), rgba(0,0,0,0.92))'}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 1180, height: 760, borderRadius: 150, overflow: 'hidden', border: '22px solid #EEF1F6', boxShadow: '0 0 0 8px rgba(0,0,0,0.35), 0 30px 80px rgba(0,0,0,0.7), inset 0 0 60px rgba(0,0,0,0.5)', transform: `scale(${s})`, position: 'relative'}}>
          {children}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.18), transparent 35%)'}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** 8a. "?" grande com ondas e brilhos, antes da revelação. */
export const BigQuestion: React.FC<{total: number}> = ({total}) => {
  const {frame, fps, enter, exit} = useLife(total);
  const pulse = 1 + 0.07 * Math.sin(frame / 4);
  const wobble = 5 * Math.sin(frame / 6);
  const s = spring({frame, fps, config: {damping: 9, stiffness: 120}});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6, opacity: exit}}>
      <div style={{position: 'relative', width: 420, height: 330, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {[0, 1, 2].map((i) => {
          const t = ((frame + i * 20) % 60) / 60;
          return <div key={i} style={{position: 'absolute', width: 190 + t * 220, height: 190 + t * 220, borderRadius: '50%', border: `4px solid ${GOLD}`, opacity: (1 - t) * 0.7}} />;
        })}
        <div style={{fontFamily: FONT, fontSize: 280, lineHeight: 1, color: GOLD, textShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 40px rgba(255,200,61,0.7)', WebkitTextStroke: `7px ${NAVY}`, transform: `scale(${pulse * (0.3 + 0.7 * s)}) rotate(${wobble}deg)`, opacity: enter}}>?</div>
        {[[-170, 20, 26, 0], [170, 40, 20, 8], [-130, 250, 18, 15], [150, 240, 24, 4]].map(([dx, dy, sz, ph], i) => (
          <Sparkle key={i} x={210 + (dx as number)} y={dy as number} size={sz as number} phase={ph as number} frame={frame} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 8b. Revelação: cortina tricolor, PARIS em letras que caem, foto real da torre em papel rasgado e confete. */
export const Reveal: React.FC<{total: number; franceAt: number}> = ({total, franceAt}) => {
  const {frame, fps, exit} = useLife(total);
  const curtain = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const curtainOut = interpolate(frame, [14, 30], [1, 0], clamp);
  const word = 'PARIS';
  const france = spring({frame: frame - franceAt, fps, config: {damping: 16, stiffness: 140}});
  const photo = spring({frame: frame - 26, fps, config: {damping: 12, stiffness: 90}});
  const colors = [BLUE, WHITE, RED, GOLD];
  const confetti = Array.from({length: 70}, (_, i) => {
    const x = random(`cx${i}`) * 1920;
    const delay = random(`cd${i}`) * 26;
    const speed = 5 + random(`cs${i}`) * 7;
    const sway = (random(`cw${i}`) - 0.5) * 80;
    const t = Math.max(0, frame - 8 - delay);
    return {x: x + Math.sin(t / 8) * sway, y: -40 + t * speed, rot: t * (6 + random(`cr${i}`) * 10), color: colors[i % 4], w: 10 + random(`cz${i}`) * 10};
  });
  return (
    <AbsoluteFill style={{opacity: exit}}>
      <AbsoluteFill>
        {[BLUE, WHITE, RED].map((c, i) => (
          <div key={i} style={{position: 'absolute', top: 0, bottom: 0, left: `${i * 33.4}%`, width: '33.4%', background: c, transformOrigin: 'left', transform: `scaleX(${curtain * curtainOut})`, opacity: 0.92}} />
        ))}
      </AbsoluteFill>
      {/* foto da torre */}
      <div style={{position: 'absolute', right: 70, top: 14, transform: `translateY(${(1 - photo) * -800}px) rotate(${6 - (1 - photo) * 14}deg)`, opacity: Math.min(1, photo * 2)}}>
        <TornPaper w={270} h={360} seed="eiffel" pad={12} tapes={[{x: 80, y: -16, w: 110, rot: 4}]}>
          <Img src={staticFile('img/pexels-16292278.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%'}} />
        </TornPaper>
      </div>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20}}>
        <div style={{textAlign: 'center', fontFamily: FONT, color: WHITE, textShadow: '0 8px 30px rgba(0,0,0,0.65)'}}>
          <div style={{display: 'flex', justifyContent: 'center', fontSize: 200, lineHeight: 1, letterSpacing: 10}}>
            {word.split('').map((ch, i) => {
              const s = spring({frame: frame - 12 - i * 3, fps, config: {damping: 10, stiffness: 150}});
              return <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - s) * -420}px) rotate(${(1 - s) * -14}deg)`, opacity: Math.min(1, s * 2)}}>{ch}</span>;
            })}
          </div>
          <div style={{display: 'flex', height: 18, width: 640, margin: '6px auto 0', transform: `scaleX(${interpolate(frame, [30, 48], [0, 1], clamp)})`, boxShadow: '0 4px 16px rgba(0,0,0,0.45)'}}>
            <div style={{flex: 1, background: BLUE}} /><div style={{flex: 1, background: WHITE}} /><div style={{flex: 1, background: RED}} />
          </div>
          <div style={{fontSize: 70, letterSpacing: 18, marginTop: 10, opacity: Math.max(0, france), transform: `translateY(${(1 - Math.min(1, Math.max(0, france))) * 36}px)`}}>FRANÇA</div>
        </div>
      </AbsoluteFill>
      {confetti.map((c, i) => (
        <div key={i} style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.w * 0.55, background: c.color, transform: `rotate(${c.rot}deg)`, opacity: c.y < 1100 ? 0.95 : 0}} />
      ))}
    </AbsoluteFill>
  );
};

