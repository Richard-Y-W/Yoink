import { useId } from 'react';
import { ART_HUES, ITEM_ART } from '../itemArt.js';

const FIXED = { ink: '#171326', white: '#fff', blush: '#FFB9DC', none: 'none' };

function roleColor(role, hue, hue2) {
  if (!role) return undefined;
  if (role.startsWith('#')) return role;
  if (FIXED[role]) return FIXED[role];
  if (role === 'accent') return hue2.deep;
  if (role === 'accent2') return hue2.base;
  return hue[role] ?? role;
}

function renderShape(shape, key, overrides = {}) {
  const common = {
    key,
    transform: shape.transform,
    opacity: overrides.opacity ?? shape.opacity,
    fill: overrides.fill,
    stroke: overrides.stroke,
    strokeWidth: overrides.strokeWidth,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  };
  if (shape.t === 'circle') return <circle {...common} cx={shape.cx} cy={shape.cy} r={shape.r} />;
  if (shape.t === 'ellipse') return <ellipse {...common} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
  if (shape.t === 'rect') return <rect {...common} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} />;
  return <path {...common} d={shape.d} />;
}

// Renders one catalog item in the chosen art style.
//  - sticker: flat kawaii vector with a white die-cut edge and ink outline
//  - vinyl:   soft-shaded collectible render with speculars and a shadow
//  - spin:    vinyl on a dark turntable; animates (or takes a controlled
//             spinDeg for drag-to-spin) via a 3D wrapper
export default function ItemArt({ kind, artStyle = 'vinyl', width = 96, animate = false, spinDeg = null }) {
  const gradientId = `yart-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const art = ITEM_ART[kind];
  if (!art) return null;

  const hue = ART_HUES[art.hue];
  const hue2 = ART_HUES[art.hue2 ?? art.hue];
  const color = (role) => roleColor(role, hue, hue2);
  const flat = artStyle === 'sticker';
  const height = Math.round(width * (120 / 140));

  const detailNodes = art.details.map((shape, index) => renderShape(shape, `d${index}`, {
    fill: color(shape.fill ?? 'none'),
    stroke: shape.stroke ? color(shape.stroke) : (flat && shape.outline ? FIXED.ink : undefined),
    strokeWidth: shape.sw ?? (flat && shape.outline ? 3.5 : undefined),
  }));

  const svg = (
    <svg viewBox="0 0 140 120" width={width} height={height} style={{ display: 'block' }} aria-hidden="true">
      {!flat && (
        <defs>
          <radialGradient id={gradientId} cx="38%" cy="28%" r="85%">
            <stop offset="0%" stopColor={hue.light} />
            <stop offset="55%" stopColor={hue.base} />
            <stop offset="100%" stopColor={hue.deep} />
          </radialGradient>
        </defs>
      )}
      {artStyle === 'spin' && <ellipse cx="70" cy="107" rx="46" ry="9" fill="none" stroke="#8B78E6" strokeWidth="2" opacity="0.55" />}
      {!flat && <ellipse cx="70" cy="107" rx="36" ry="7" fill={artStyle === 'spin' ? 'rgba(0,0,0,.5)' : 'rgba(23,19,38,.16)'} />}
      {flat && <g stroke="#fff" strokeWidth="16" strokeLinejoin="round" fill={hue.base}>{art.sil.map((shape, index) => renderShape(shape, `w${index}`))}</g>}
      {flat && <g stroke={FIXED.ink} strokeWidth="6" strokeLinejoin="round" fill={hue.base}>{art.sil.map((shape, index) => renderShape(shape, `o${index}`))}</g>}
      <g fill={flat ? hue.base : `url(#${gradientId})`}>{art.sil.map((shape, index) => renderShape(shape, `s${index}`))}</g>
      {detailNodes}
      {!flat && (art.spec ?? []).map((spec, index) => (
        <ellipse
          key={`sp${index}`}
          cx={spec.cx}
          cy={spec.cy}
          rx={spec.rx}
          ry={spec.ry}
          fill="#fff"
          opacity="0.68"
          transform={`rotate(${spec.rot ?? 0} ${spec.cx} ${spec.cy})`}
        />
      ))}
    </svg>
  );

  if (artStyle !== 'spin') return svg;

  return (
    <div style={{ perspective: '620px', width, height }}>
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: spinDeg !== null ? `rotateY(${spinDeg}deg)` : undefined,
          animation: spinDeg === null && animate ? 'yturn 5.5s ease-in-out infinite' : undefined,
        }}
      >
        {svg}
      </div>
    </div>
  );
}
