import { s } from '../style.js';

// Broker-style OHLCV candlestick chart in pure SVG, Yoink palette:
// orange candles up, brand purple down, volume ghosted underneath,
// dashed last-price line with a live tag on the right gutter.

const UP = '#E89B2E';
const DOWN = '#6A5ACD';
const GRID = '#EDEAF6';
const LABEL = '#8C8A99';

const compact = (n) => {
  if (n >= 100000) return `${Math.round(n / 1000)}k`;
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
};

export default function CandleChart({ candles = [], width = 328, height = 224 }) {
  if (candles.length < 2) return null;

  const padLeft = 6;
  const gutter = 46;
  const priceH = height - 52;
  const volTop = priceH + 10;
  const volH = height - volTop - 2;
  const chartW = width - padLeft - gutter;
  const step = chartW / candles.length;
  const bodyW = Math.max(2, step * 0.62);

  let min = Infinity;
  let max = 0;
  let vMax = 1;
  for (const candle of candles) {
    if (candle.l < min) min = candle.l;
    if (candle.h > max) max = candle.h;
    if (candle.v > vMax) vMax = candle.v;
  }
  const span = (max - min) || 1;
  min -= span * 0.05;
  max += span * 0.05;
  const y = (p) => priceH * (1 - (p - min) / (max - min));

  const last = candles[candles.length - 1];
  const lastUp = last.c >= last.o;
  const grid = [max - span * 0.05, (min + max) / 2, min + span * 0.05];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={s('width:100%;height:auto;display:block')}
      role="img"
      aria-label="Price candles"
    >
      {grid.map((level, i) => (
        <g key={i}>
          <line x1={padLeft} y1={y(level)} x2={padLeft + chartW} y2={y(level)} stroke={GRID} strokeWidth="1" />
          <text x={width - gutter + 5} y={y(level) + 3} fill={LABEL} style={s("font:700 8.5px 'Nunito',sans-serif")}>
            {compact(level)}
          </text>
        </g>
      ))}

      {candles.map((candle, i) => {
        const cx = padLeft + i * step + step / 2;
        const up = candle.c >= candle.o;
        const color = up ? UP : DOWN;
        const bodyTop = y(Math.max(candle.o, candle.c));
        const bodyH = Math.max(1.4, Math.abs(y(candle.o) - y(candle.c)));
        return (
          <g key={candle.t}>
            <line x1={cx} y1={y(candle.h)} x2={cx} y2={y(candle.l)} stroke={color} strokeWidth="1.3" />
            <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} rx="1" fill={color} />
            <rect
              x={cx - bodyW / 2}
              y={volTop + volH * (1 - candle.v / vMax)}
              width={bodyW}
              height={Math.max(1, volH * (candle.v / vMax))}
              rx="1"
              fill={color}
              opacity="0.3"
            />
          </g>
        );
      })}

      {/* live price line + tag */}
      <line
        x1={padLeft}
        y1={y(last.c)}
        x2={padLeft + chartW}
        y2={y(last.c)}
        stroke={lastUp ? UP : DOWN}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.85"
      />
      <rect x={width - gutter + 1} y={y(last.c) - 8} width={gutter - 3} height={16} rx="5" fill={lastUp ? UP : DOWN} />
      <text
        x={width - gutter / 2 - 0.5}
        y={y(last.c) + 3.5}
        fill="#fff"
        textAnchor="middle"
        style={s("font:800 8.5px 'Nunito',sans-serif")}
      >
        {compact(last.c)}
      </text>
    </svg>
  );
}
