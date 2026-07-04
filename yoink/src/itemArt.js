// Item art library: hand-tuned vector geometry for every catalog archetype,
// rendered by <ItemArt> in one of three styles. Geometry is shared across
// styles — "sticker" draws it flat with a die-cut outline, "vinyl" fills it
// with soft gradients and speculars, "spin" is vinyl on a 3D turntable.

export const ART_STYLES = ['sticker', 'vinyl', 'spin'];

export const ART_STYLE_LABELS = {
  sticker: 'Sticker',
  vinyl: 'Vinyl',
  spin: '3D',
};

// Tints match the design's TINT/SAT palette in data.js.
export const ART_HUES = {
  yellow: { light: '#FFF6C9', base: '#FFE177', shade: '#F0C93F', deep: '#EFA100', tint: ['#FFEDA6', '#FFE177'] },
  pink:   { light: '#FFE4F1', base: '#FFB9DC', shade: '#F493C4', deep: '#FF3D9A', tint: ['#FFD6EA', '#FFB9DC'] },
  purple: { light: '#EFE6FF', base: '#D6C2FF', shade: '#B99CF3', deep: '#8B5CF6', tint: ['#E9DEFF', '#D6C2FF'] },
  teal:   { light: '#DFFBF4', base: '#A6EEDD', shade: '#7FD9C4', deep: '#10B5A0', tint: ['#C7F5EC', '#A6EEDD'] },
  coral:  { light: '#FFE3D5', base: '#FFC1A6', shade: '#F5A17C', deep: '#FF6B3D', tint: ['#FFD9C9', '#FFC1A6'] },
  blue:   { light: '#E0EEFF', base: '#AFD2FF', shade: '#8AB8F2', deep: '#3B82F6', tint: ['#CFE4FF', '#AFD2FF'] },
  orange: { light: '#FFEFD4', base: '#FFD9A0', shade: '#F2BE6E', deep: '#E89B2E', tint: ['#FFE9C9', '#FFD9A0'] },
  white:  { light: '#FFFFFF', base: '#F2F0F9', shade: '#DDD9EA', deep: '#B9B3CC', tint: ['#F4F2FA', '#EBE8F4'] },
};

// Shape roles resolve against the art's hue (base/light/shade/deep), its
// accent hue (accent = hue2.deep, accent2 = hue2.base), or fixed colors.
// Literal '#rrggbb' fills pass straight through.

export const ITEM_ART = {
  duck: {
    hue: 'yellow', hue2: 'orange', bg: 'pink',
    sil: [
      { t: 'circle', cx: 56, cy: 44, r: 24 },
      { t: 'ellipse', cx: 76, cy: 82, rx: 34, ry: 22 },
    ],
    details: [
      { t: 'path', d: 'M74 74 q16 -10 26 2 q-14 12 -26 2 z', fill: 'shade' },
      { t: 'path', d: 'M33 42 q-13 3 -2 11 q9 5 13 -3 z', fill: 'accent', outline: true },
      { t: 'circle', cx: 49, cy: 39, r: 3.8, fill: 'ink' },
      { t: 'circle', cx: 50.3, cy: 37.7, r: 1.3, fill: 'white' },
      { t: 'circle', cx: 62, cy: 52, r: 4.5, fill: 'blush' },
    ],
    spec: [{ cx: 46, cy: 29, rx: 8, ry: 5, rot: -24 }],
  },
  polaroid: {
    hue: 'white', hue2: 'coral', bg: 'teal',
    sil: [
      { t: 'rect', x: 30, y: 40, w: 80, h: 52, rx: 10 },
      { t: 'rect', x: 42, y: 30, w: 56, h: 16, rx: 8 },
    ],
    details: [
      { t: 'rect', x: 38, y: 48, w: 6, h: 38, fill: 'accent' },
      { t: 'rect', x: 46, y: 48, w: 4, h: 38, fill: '#FFB84D' },
      { t: 'rect', x: 52, y: 48, w: 3, h: 38, fill: '#10B5A0' },
      { t: 'circle', cx: 80, cy: 64, r: 15, fill: 'ink' },
      { t: 'circle', cx: 80, cy: 64, r: 9, fill: '#5C5480' },
      { t: 'circle', cx: 76, cy: 60, r: 3, fill: 'white' },
      { t: 'rect', x: 84, y: 33, w: 10, h: 9, rx: 3, fill: 'ink' },
      { t: 'rect', x: 38, y: 84, w: 64, h: 4, rx: 2, fill: 'ink', opacity: 0.75 },
    ],
    spec: [{ cx: 50, cy: 36, rx: 10, ry: 4, rot: -14 }],
  },
  slab: {
    hue: 'purple', hue2: 'yellow', bg: 'yellow',
    sil: [{ t: 'rect', x: 44, y: 16, w: 52, h: 88, rx: 8 }],
    details: [
      { t: 'rect', x: 50, y: 34, w: 40, h: 56, rx: 4, fill: 'white' },
      { t: 'rect', x: 50, y: 22, w: 40, h: 9, rx: 3, fill: 'accent' },
      { t: 'path', d: 'M70 44 l4.5 9 10 1.5 -7 7 1.7 10 -9.2 -4.8 -9.2 4.8 1.7 -10 -7 -7 10 -1.5 z', fill: 'deep' },
      { t: 'rect', x: 54, y: 80, w: 32, h: 4, rx: 2, fill: 'shade' },
    ],
    spec: [{ cx: 56, cy: 26, rx: 7, ry: 3.4, rot: -18 }],
  },
  flipphone: {
    hue: 'pink', hue2: 'purple', bg: 'purple',
    sil: [
      { t: 'rect', x: 48, y: 16, w: 44, h: 40, rx: 9 },
      { t: 'rect', x: 48, y: 60, w: 44, h: 42, rx: 9 },
      { t: 'rect', x: 46, y: 54, w: 48, h: 8, rx: 4 },
    ],
    details: [
      { t: 'rect', x: 54, y: 22, w: 32, h: 26, rx: 4, fill: 'white' },
      { t: 'rect', x: 88, y: 8, w: 4, h: 12, rx: 2, fill: 'deep' },
      { t: 'circle', cx: 90, cy: 7, r: 3.5, fill: 'accent' },
      { t: 'circle', cx: 60, cy: 72, r: 2.2, fill: 'ink', opacity: 0.45 },
      { t: 'circle', cx: 70, cy: 72, r: 2.2, fill: 'ink', opacity: 0.45 },
      { t: 'circle', cx: 80, cy: 72, r: 2.2, fill: 'ink', opacity: 0.45 },
      { t: 'circle', cx: 60, cy: 83, r: 2.2, fill: 'ink', opacity: 0.45 },
      { t: 'circle', cx: 70, cy: 83, r: 2.2, fill: 'ink', opacity: 0.45 },
      { t: 'circle', cx: 80, cy: 83, r: 2.2, fill: 'ink', opacity: 0.45 },
      { t: 'circle', cx: 65, cy: 94, r: 2.2, fill: 'ink', opacity: 0.45 },
      { t: 'circle', cx: 75, cy: 94, r: 2.2, fill: 'ink', opacity: 0.45 },
      { t: 'path', d: 'M98 92 c-3 -4 -9 -1 -7 4 c1 3 7 6 7 6 c0 0 6 -3 7 -6 c2 -5 -4 -8 -7 -4 z', fill: 'accent', outline: true },
      { t: 'path', d: 'M92 98 q3 -3 6 -5', stroke: 'ink', sw: 2, fill: 'none' },
      { t: 'circle', cx: 56, cy: 34, r: 3, fill: 'blush' },
    ],
    spec: [{ cx: 56, cy: 66, rx: 8, ry: 4, rot: -15 }],
  },
  lava: {
    hue: 'coral', hue2: 'purple', bg: 'blue',
    sil: [
      { t: 'path', d: 'M60 26 h20 q3 0 4 4 l8 58 h-44 l8 -58 q1 -4 4 -4 z' },
      { t: 'rect', x: 48, y: 88, w: 44, h: 12, rx: 5 },
      { t: 'rect', x: 62, y: 16, w: 16, h: 12, rx: 4 },
    ],
    details: [
      { t: 'path', d: 'M62 32 h16 l6 48 h-28 z', fill: 'light' },
      { t: 'circle', cx: 70, cy: 70, r: 8, fill: 'deep' },
      { t: 'circle', cx: 66, cy: 55, r: 5, fill: 'deep' },
      { t: 'circle', cx: 75, cy: 44, r: 3.5, fill: 'deep' },
      { t: 'rect', x: 52, y: 92, w: 36, h: 3, fill: 'shade' },
    ],
    spec: [{ cx: 61, cy: 44, rx: 4, ry: 10, rot: 6 }],
  },
  console: {
    hue: 'teal', hue2: 'purple', bg: 'coral',
    sil: [{ t: 'rect', x: 34, y: 36, w: 72, h: 50, rx: 11 }],
    details: [
      { t: 'rect', x: 46, y: 43, w: 48, h: 26, rx: 4, fill: 'ink' },
      { t: 'rect', x: 64, y: 50, w: 12, h: 10, rx: 2, fill: 'accent' },
      { t: 'circle', cx: 52, cy: 48, r: 2.5, fill: 'white', opacity: 0.7 },
      { t: 'rect', x: 42, y: 75, w: 14, h: 5, rx: 2, fill: 'deep' },
      { t: 'rect', x: 46.5, y: 70.5, w: 5, h: 14, rx: 2, fill: 'deep' },
      { t: 'circle', cx: 90, cy: 76, r: 4.5, fill: 'accent' },
      { t: 'circle', cx: 80, cy: 80, r: 4.5, fill: 'blush' },
    ],
    spec: [{ cx: 44, cy: 41, rx: 9, ry: 4, rot: -14 }],
  },
  gacha: {
    hue: 'purple', hue2: 'orange', bg: 'teal',
    sil: [{ t: 'circle', cx: 70, cy: 58, r: 32 }],
    details: [
      { t: 'path', d: 'M38 58 a32 32 0 0 0 64 0 z', fill: 'white' },
      { t: 'rect', x: 38, y: 56, w: 64, h: 3, fill: 'shade' },
      { t: 'circle', cx: 70, cy: 58, r: 6, fill: 'accent' },
      { t: 'path', d: 'M58 34 l2.5 5 5.5 .8 -4 3.9 1 5.5 -5 -2.7 -5 2.7 1 -5.5 -4 -3.9 5.5 -.8 z', fill: 'white', opacity: 0.85 },
    ],
    spec: [{ cx: 58, cy: 40, rx: 10, ry: 5, rot: -22 }],
  },
  imac: {
    hue: 'blue', hue2: 'teal', bg: 'coral',
    sil: [
      { t: 'rect', x: 34, y: 30, w: 72, h: 50, rx: 12 },
      { t: 'path', d: 'M50 80 h40 l8 16 h-56 z' },
    ],
    details: [
      { t: 'rect', x: 44, y: 38, w: 52, h: 32, rx: 5, fill: 'white' },
      { t: 'circle', cx: 70, cy: 75, r: 2.5, fill: 'white', opacity: 0.8 },
      { t: 'rect', x: 58, y: 88, w: 24, h: 3, rx: 1.5, fill: 'shade' },
      { t: 'path', d: 'M52 44 q8 -3 16 0', stroke: 'shade', sw: 2.5, fill: 'none' },
    ],
    spec: [{ cx: 48, cy: 35, rx: 10, ry: 4, rot: -12 }],
  },
  beanie: {
    hue: 'coral', hue2: 'pink', bg: 'teal',
    sil: [
      { t: 'circle', cx: 70, cy: 62, r: 30 },
      { t: 'circle', cx: 46, cy: 38, r: 10 },
      { t: 'circle', cx: 94, cy: 38, r: 10 },
    ],
    details: [
      { t: 'circle', cx: 46, cy: 38, r: 5, fill: 'blush' },
      { t: 'circle', cx: 94, cy: 38, r: 5, fill: 'blush' },
      { t: 'ellipse', cx: 70, cy: 72, rx: 13, ry: 10, fill: 'white' },
      { t: 'path', d: 'M66 68 h8 l-4 5 z', fill: 'ink' },
      { t: 'circle', cx: 60, cy: 58, r: 3, fill: 'ink' },
      { t: 'circle', cx: 80, cy: 58, r: 3, fill: 'ink' },
      { t: 'rect', x: 96, y: 68, w: 15, h: 19, rx: 4, fill: 'white', outline: true, transform: 'rotate(18 103 77)' },
      { t: 'path', d: 'M98 72 q-4 -5 -8 -7', stroke: 'ink', sw: 2, fill: 'none' },
    ],
    spec: [{ cx: 56, cy: 44, rx: 9, ry: 5, rot: -24 }],
  },
  tamagotchi: {
    hue: 'pink', hue2: 'teal', bg: 'blue',
    sil: [{ t: 'ellipse', cx: 70, cy: 60, rx: 32, ry: 38 }],
    details: [
      { t: 'rect', x: 56, y: 42, w: 28, h: 24, rx: 5, fill: 'white' },
      { t: 'rect', x: 66, y: 52, w: 8, h: 8, fill: 'deep' },
      { t: 'rect', x: 66, y: 50, w: 2, h: 2, fill: 'deep' },
      { t: 'rect', x: 72, y: 50, w: 2, h: 2, fill: 'deep' },
      { t: 'circle', cx: 60, cy: 78, r: 3.5, fill: 'accent' },
      { t: 'circle', cx: 70, cy: 82, r: 3.5, fill: 'accent' },
      { t: 'circle', cx: 80, cy: 78, r: 3.5, fill: 'accent' },
    ],
    spec: [{ cx: 56, cy: 34, rx: 9, ry: 6, rot: -24 }],
  },
  stickerpack: {
    hue: 'yellow', hue2: 'pink', bg: 'pink',
    sil: [
      { t: 'rect', x: 38, y: 34, w: 52, h: 64, rx: 8, transform: 'rotate(-8 64 66)' },
      { t: 'rect', x: 48, y: 28, w: 52, h: 68, rx: 8 },
    ],
    details: [
      { t: 'rect', x: 48, y: 28, w: 52, h: 12, rx: 6, fill: 'shade' },
      { t: 'circle', cx: 66, cy: 58, r: 9, fill: 'accent' },
      { t: 'circle', cx: 84, cy: 50, r: 6, fill: 'white' },
      { t: 'path', d: 'M80 70 l2.5 5 5.5 .8 -4 3.9 1 5.5 -5 -2.7 -5 2.7 1 -5.5 -4 -3.9 5.5 -.8 z', fill: 'white', opacity: 0.9 },
    ],
    spec: [{ cx: 58, cy: 36, rx: 9, ry: 4, rot: -14 }],
  },
  kaleidoscope: {
    hue: 'purple', hue2: 'yellow', bg: 'yellow',
    sil: [
      { t: 'rect', x: 30, y: 50, w: 74, h: 20, rx: 10 },
      { t: 'circle', cx: 32, cy: 60, r: 12 },
      { t: 'rect', x: 100, y: 46, w: 12, h: 28, rx: 5 },
    ],
    details: [
      { t: 'circle', cx: 32, cy: 60, r: 5.5, fill: 'ink' },
      { t: 'rect', x: 54, y: 50, w: 6, h: 20, fill: 'accent' },
      { t: 'rect', x: 74, y: 50, w: 6, h: 20, fill: 'accent' },
      { t: 'path', d: 'M112 55 l6 5 -6 5 z', fill: 'blush' },
      { t: 'path', d: 'M120 38 l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6 z', fill: 'accent' },
    ],
    spec: [{ cx: 50, cy: 54, rx: 10, ry: 3.4, rot: -4 }],
  },
  walkman: {
    hue: 'blue', hue2: 'coral', bg: 'coral',
    sil: [{ t: 'rect', x: 40, y: 40, w: 60, h: 48, rx: 9 }],
    details: [
      { t: 'rect', x: 48, y: 56, w: 44, h: 22, rx: 5, fill: 'white' },
      { t: 'circle', cx: 60, cy: 67, r: 7, fill: 'base' },
      { t: 'circle', cx: 80, cy: 67, r: 7, fill: 'base' },
      { t: 'circle', cx: 60, cy: 67, r: 2, fill: 'ink' },
      { t: 'circle', cx: 80, cy: 67, r: 2, fill: 'ink' },
      { t: 'rect', x: 48, y: 45, w: 20, h: 6, rx: 3, fill: 'shade' },
      { t: 'rect', x: 74, y: 45, w: 8, h: 6, rx: 3, fill: 'accent' },
      { t: 'path', d: 'M46 36 q24 -22 48 0', stroke: 'ink', sw: 5, fill: 'none' },
      { t: 'circle', cx: 46, cy: 38, r: 5, fill: 'accent', outline: true },
      { t: 'circle', cx: 94, cy: 38, r: 5, fill: 'accent', outline: true },
    ],
    spec: [{ cx: 52, cy: 48, rx: 8, ry: 3.4, rot: -12 }],
  },
  pog: {
    hue: 'orange', hue2: 'purple', bg: 'purple',
    sil: [
      { t: 'ellipse', cx: 70, cy: 88, rx: 30, ry: 9 },
      { t: 'ellipse', cx: 70, cy: 80, rx: 30, ry: 9 },
      { t: 'circle', cx: 70, cy: 52, r: 26 },
    ],
    details: [
      { t: 'circle', cx: 70, cy: 52, r: 17, fill: 'white' },
      { t: 'path', d: 'M66 40 h10 l-6 10 h8 l-14 16 4 -12 h-8 z', fill: 'accent' },
      { t: 'path', d: 'M40 80 a30 9 0 0 0 60 0', stroke: 'shade', sw: 2, fill: 'none' },
    ],
    spec: [{ cx: 58, cy: 40, rx: 9, ry: 5, rot: -24 }],
  },
  marbles: {
    hue: 'blue', hue2: 'teal', bg: 'coral',
    sil: [
      { t: 'rect', x: 46, y: 40, w: 48, h: 54, rx: 12 },
      { t: 'rect', x: 54, y: 30, w: 32, h: 14, rx: 6 },
    ],
    details: [
      { t: 'rect', x: 52, y: 26, w: 36, h: 8, rx: 4, fill: 'accent' },
      { t: 'circle', cx: 58, cy: 80, r: 7, fill: 'blush' },
      { t: 'circle', cx: 72, cy: 82, r: 7, fill: 'accent' },
      { t: 'circle', cx: 84, cy: 78, r: 6, fill: '#FFE177' },
      { t: 'circle', cx: 64, cy: 68, r: 6, fill: 'deep' },
      { t: 'circle', cx: 78, cy: 66, r: 5, fill: '#D6C2FF' },
      { t: 'rect', x: 52, y: 46, w: 5, h: 40, rx: 2.5, fill: 'white', opacity: 0.55 },
    ],
    spec: [{ cx: 56, cy: 44, rx: 6, ry: 9, rot: 6 }],
  },
  pin: {
    hue: 'pink', hue2: 'yellow', bg: 'yellow',
    sil: [
      { t: 'rect', x: 54, y: 30, w: 12, h: 12 },
      { t: 'rect', x: 78, y: 30, w: 12, h: 12 },
      { t: 'rect', x: 42, y: 42, w: 60, h: 12 },
      { t: 'rect', x: 54, y: 54, w: 36, h: 12 },
      { t: 'rect', x: 66, y: 66, w: 12, h: 12 },
    ],
    details: [
      { t: 'rect', x: 58, y: 34, w: 6, h: 6, fill: 'white', opacity: 0.8 },
      { t: 'circle', cx: 98, cy: 76, r: 5, fill: '#C9C4DA', outline: true },
    ],
    spec: [{ cx: 52, cy: 44, rx: 7, ry: 4, rot: -16 }],
  },
  coin: {
    hue: 'yellow', hue2: 'orange', bg: 'purple',
    sil: [{ t: 'circle', cx: 70, cy: 60, r: 30 }],
    details: [
      { t: 'circle', cx: 70, cy: 60, r: 22, fill: 'none', stroke: 'deep', sw: 4 },
      { t: 'path', d: 'M62 50 l8 10 8 -10 M70 60 v14', stroke: 'ink', sw: 5, fill: 'none' },
    ],
    spec: [{ cx: 58, cy: 46, rx: 9, ry: 5, rot: -24 }],
  },
  claw: {
    hue: 'purple', hue2: 'yellow', bg: 'yellow',
    sil: [
      { t: 'path', d: 'M44 52 a26 26 0 0 1 52 0 z' },
      { t: 'rect', x: 40, y: 52, w: 60, h: 44, rx: 6 },
    ],
    details: [
      { t: 'path', d: 'M50 52 a20 20 0 0 1 40 0 z', fill: 'white', opacity: 0.7 },
      { t: 'path', d: 'M70 40 v10 M70 50 l-7 8 M70 50 l7 8', stroke: 'ink', sw: 4, fill: 'none' },
      { t: 'circle', cx: 58, cy: 88, r: 6, fill: '#FFE177' },
      { t: 'circle', cx: 72, cy: 90, r: 6, fill: '#FFB9DC' },
      { t: 'circle', cx: 84, cy: 88, r: 5, fill: '#A6EEDD' },
      { t: 'circle', cx: 70, cy: 22, r: 4, fill: '#FFB84D' },
      { t: 'rect', x: 46, y: 58, w: 48, h: 24, rx: 4, fill: 'white', opacity: 0.25 },
    ],
    spec: [{ cx: 58, cy: 36, rx: 9, ry: 5, rot: -24 }],
  },
  eraser: {
    hue: 'pink', hue2: 'yellow', bg: 'blue',
    sil: [
      { t: 'circle', cx: 70, cy: 64, r: 26 },
      { t: 'path', d: 'M52 48 l-5 -17 15 9 z' },
      { t: 'path', d: 'M88 48 l5 -17 -15 9 z' },
    ],
    details: [
      { t: 'circle', cx: 62, cy: 60, r: 2.8, fill: 'ink' },
      { t: 'circle', cx: 78, cy: 60, r: 2.8, fill: 'ink' },
      { t: 'path', d: 'M67 66 h6 l-3 4 z', fill: 'ink' },
      { t: 'path', d: 'M46 66 h-10 M94 66 h10 M47 72 l-9 3 M93 72 l9 3', stroke: 'ink', sw: 2, fill: 'none' },
      { t: 'circle', cx: 56, cy: 70, r: 3.5, fill: 'blush' },
      { t: 'circle', cx: 84, cy: 70, r: 3.5, fill: 'blush' },
    ],
    spec: [{ cx: 58, cy: 50, rx: 8, ry: 5, rot: -20 }],
  },
  boba: {
    hue: 'orange', hue2: 'pink', bg: 'teal',
    sil: [
      { t: 'path', d: 'M52 44 h36 l-5 48 q-1 6 -7 6 h-12 q-6 0 -7 -6 z' },
      { t: 'ellipse', cx: 70, cy: 44, rx: 20, ry: 6 },
      { t: 'rect', x: 66, y: 16, w: 8, h: 26, rx: 3, transform: 'rotate(8 70 30)' },
    ],
    details: [
      { t: 'circle', cx: 61, cy: 86, r: 4, fill: 'ink' },
      { t: 'circle', cx: 70, cy: 88, r: 4, fill: 'ink' },
      { t: 'circle', cx: 79, cy: 86, r: 4, fill: 'ink' },
      { t: 'circle', cx: 65, cy: 79, r: 3.5, fill: 'ink' },
      { t: 'circle', cx: 75, cy: 79, r: 3.5, fill: 'ink' },
      { t: 'rect', x: 57, y: 52, w: 5, h: 34, rx: 2.5, fill: 'white', opacity: 0.5 },
      { t: 'circle', cx: 76, cy: 12, r: 5, fill: 'none', stroke: 'accent', sw: 3 },
    ],
    spec: [{ cx: 60, cy: 54, rx: 5, ry: 9, rot: 6 }],
  },
  slime: {
    hue: 'purple', hue2: 'teal', bg: 'pink',
    sil: [
      { t: 'rect', x: 46, y: 44, w: 48, h: 50, rx: 10 },
      { t: 'rect', x: 52, y: 32, w: 36, h: 14, rx: 5 },
    ],
    details: [
      { t: 'rect', x: 50, y: 28, w: 40, h: 10, rx: 5, fill: 'accent' },
      { t: 'path', d: 'M50 62 q6 -8 12 0 q6 8 12 0 q6 -8 16 0 v22 q0 6 -6 6 h-28 q-6 0 -6 -6 z', fill: 'deep', opacity: 0.75 },
      { t: 'path', d: 'M60 70 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z', fill: 'white', opacity: 0.9 },
      { t: 'path', d: 'M78 76 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 z', fill: 'white', opacity: 0.8 },
      { t: 'rect', x: 52, y: 50, w: 5, h: 36, rx: 2.5, fill: 'white', opacity: 0.5 },
    ],
    spec: [{ cx: 56, cy: 48, rx: 6, ry: 8, rot: 6 }],
  },
  plush: {
    hue: 'pink', hue2: 'purple', bg: 'blue',
    sil: [
      { t: 'circle', cx: 52, cy: 44, r: 9 },
      { t: 'circle', cx: 88, cy: 44, r: 9 },
      { t: 'path', d: 'M40 76 q-2 -26 30 -28 q32 2 30 28 q1 16 -30 16 q-31 0 -30 -16 z' },
    ],
    details: [
      { t: 'circle', cx: 60, cy: 68, r: 3, fill: 'ink' },
      { t: 'circle', cx: 80, cy: 68, r: 3, fill: 'ink' },
      { t: 'path', d: 'M66 74 q4 4 8 0', stroke: 'ink', sw: 2.5, fill: 'none' },
      { t: 'circle', cx: 54, cy: 74, r: 4, fill: 'blush' },
      { t: 'circle', cx: 86, cy: 74, r: 4, fill: 'blush' },
    ],
    spec: [{ cx: 56, cy: 58, rx: 9, ry: 5, rot: -18 }],
  },
};

// Keyword → art kind, checked in order against the item's image label,
// name, and title. First hit wins; unknown items fall back to stripes.
const KIND_MATCHERS = [
  ['polaroid', 'polaroid'],
  ['slab', 'slab'],
  ['charizard', 'slab'],
  ['foil', 'slab'],
  ['card', 'slab'],
  ['flip', 'flipphone'],
  ['duck', 'duck'],
  ['lava', 'lava'],
  ['console', 'console'],
  ['gacha', 'gacha'],
  ['imac', 'imac'],
  ['beanie', 'beanie'],
  ['tamagotchi', 'tamagotchi'],
  ['sticker', 'stickerpack'],
  ['kaleidoscope', 'kaleidoscope'],
  ['walkman', 'walkman'],
  ['pog', 'pog'],
  ['marble', 'marbles'],
  ['coin', 'coin'],
  ['claw', 'claw'],
  ['eraser', 'eraser'],
  ['boba', 'boba'],
  ['slime', 'slime'],
  ['plush', 'plush'],
  ['mochi', 'plush'],
  ['pin', 'pin'],
];

export function resolveArtKind(item) {
  if (!item) return null;
  const label = `${item.img ?? ''} ${item.imageLabel ?? ''} ${item.name ?? ''} ${item.title ?? ''}`.toLowerCase();
  for (const [keyword, kind] of KIND_MATCHERS) {
    if (label.includes(keyword)) return kind;
  }
  return null;
}

// Background for the tile/hero behind the art, per style.
export function artStageBackground(artStyle, kind) {
  if (artStyle === 'sticker') {
    const bgHue = ART_HUES[ITEM_ART[kind]?.bg] ?? ART_HUES.pink;
    return `repeating-linear-gradient(135deg,${bgHue.tint[0]} 0 11px,${bgHue.tint[1]} 11px 22px)`;
  }
  if (artStyle === 'spin') {
    return 'radial-gradient(circle at 50% 30%,#241C3F,#171326 78%)';
  }
  return 'radial-gradient(circle at 50% 32%,#FFFFFF,#EDE7FC 72%)';
}
