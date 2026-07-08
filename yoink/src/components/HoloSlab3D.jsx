import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, brand } = marketTheme;

const DEFAULT_TRAITS = ['rainbow foil frame', 'chunky toy slab', 'sparkle flecks'];
const POINTER_EVENT_NAME = 'pointermove';
const HOLO_PALETTES = {
  pink: ['#FF3D9A', '#FFB84D', '#10B5A0'],
  purple: ['#6A5ACD', '#FF7BD5', '#62D6FF'],
  yellow: ['#FFB84D', '#FFF06A', '#10B5A0'],
  coral: ['#FF6B6B', '#FFB84D', '#6A5ACD'],
  teal: ['#10B5A0', '#62D6FF', '#FF7BD5'],
};

function traitsOf(item) {
  const traits = Array.isArray(item?.traits) ? item.traits : DEFAULT_TRAITS;
  const cleanTraits = traits.map((trait) => String(trait).trim()).filter(Boolean);
  return cleanTraits.length > 0 ? cleanTraits : DEFAULT_TRAITS;
}

function paletteFor(item) {
  if (item?.hue && HOLO_PALETTES[item.hue]) return HOLO_PALETTES[item.hue];

  const seed = String(item?.id ?? item?.name ?? 'holo-find');
  const paletteKeys = Object.keys(HOLO_PALETTES);
  const index = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % paletteKeys.length;
  return HOLO_PALETTES[paletteKeys[index]];
}

function createRoundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

function createRoundedSlabGeometry(width, height, depth, radius, bevelSize = 0.025) {
  const geometry = new THREE.ExtrudeGeometry(createRoundedRectShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSize,
    bevelThickness: bevelSize,
    bevelSegments: 8,
    curveSegments: 12,
  });

  geometry.center();
  return geometry;
}

function createPuffyHeartShape() {
  const shape = new THREE.Shape();
  // Bottom tip is a small rounded arc rather than a sharp cusp — a sharp point
  // makes ExtrudeGeometry's bevel pinch/self-intersect into a jagged mess.
  shape.moveTo(-0.06, -0.45);
  shape.bezierCurveTo(-0.72, -0.16, -0.76, 0.28, -0.36, 0.43);
  shape.bezierCurveTo(-0.18, 0.5, -0.04, 0.4, 0, 0.25);
  shape.bezierCurveTo(0.04, 0.4, 0.18, 0.5, 0.36, 0.43);
  shape.bezierCurveTo(0.76, 0.28, 0.72, -0.16, 0.06, -0.45);
  shape.quadraticCurveTo(0, -0.5, -0.06, -0.45);
  return shape;
}

function createSparkleShape(outerRadius = 0.12, innerRadius = 0.038) {
  const shape = new THREE.Shape();
  const points = [
    [0, outerRadius],
    [innerRadius, innerRadius],
    [outerRadius, 0],
    [innerRadius, -innerRadius],
    [0, -outerRadius],
    [-innerRadius, -innerRadius],
    [-outerRadius, 0],
    [-innerRadius, innerRadius],
  ];

  points.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

function createExtrudedShapeGeometry(shape, depth, bevelSize = 0.015, bevelSegments = 4) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize,
    bevelThickness: bevelSize,
    bevelSegments,
    curveSegments: 18,
  });
  geometry.center();
  return geometry;
}

function createToonMaterial({
  color,
  roughness = 0.36,
  metalness = 0.04,
  clearcoat = 0.7,
  emissive = color,
  emissiveIntensity = 0,
  transparent = false,
  opacity = 1,
}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness: 0.12,
    emissive,
    emissiveIntensity,
    transparent,
    opacity,
  });
}

function createSoftVinylMaterial(options) {
  return createToonMaterial({
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.95,
    ...options,
  });
}

function createHoloFoilMaterial({ palette, timeUniform, foilUniform }) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: timeUniform,
      foilUniform,
      uAccent: { value: new THREE.Color(palette[0]) },
      uAccentB: { value: new THREE.Color(palette[1]) },
      uAccentC: { value: new THREE.Color(palette[2]) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float foilUniform;
      uniform vec3 uAccent;
      uniform vec3 uAccentB;
      uniform vec3 uAccentC;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      // Sparse twinkling stars with a soft cross flare, like glitter on foil.
      float starLayer(vec2 uv, float scale, float thresh, float t) {
        uv *= scale;
        vec2 id = floor(uv);
        vec2 gv = fract(uv) - 0.5;
        float n = hash21(id);
        if (n < thresh) return 0.0;
        vec2 offs = vec2(hash21(id + 11.3), hash21(id + 41.7)) - 0.5;
        vec2 d = gv - offs * 0.72;
        float twinkle = 0.55 + 0.45 * sin(t * 2.4 + n * 42.0);
        float core = smoothstep(0.05 * twinkle, 0.0, length(d));
        float flare = smoothstep(0.42, 0.0, abs(d.x)) * smoothstep(0.02, 0.0, abs(d.y))
                    + smoothstep(0.42, 0.0, abs(d.y)) * smoothstep(0.02, 0.0, abs(d.x));
        return (core + flare * 0.3) * twinkle;
      }

      // Saturated candy stops: peach -> hot pink -> violet -> blue -> green -> gold.
      // The 2D foil is vivid, not pale, so these carry real chroma.
      vec3 candyBand(float t) {
        t = clamp(t, 0.0, 1.0);
        vec3 col = vec3(1.0, 0.74, 0.52);
        col = mix(col, vec3(1.0, 0.42, 0.82), smoothstep(0.0, 0.2, t));
        col = mix(col, vec3(0.66, 0.4, 1.0), smoothstep(0.2, 0.42, t));
        col = mix(col, vec3(0.4, 0.74, 1.0), smoothstep(0.42, 0.62, t));
        col = mix(col, vec3(0.5, 1.0, 0.76), smoothstep(0.62, 0.82, t));
        col = mix(col, vec3(1.0, 0.88, 0.42), smoothstep(0.82, 1.0, t));
        return col;
      }

      // Full-spectrum diffraction rainbow, always vivid (never muddy).
      vec3 spectrum(float h) {
        return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + h));
      }

      void main() {
        vec2 uv = vUv;
        // Diagonal candy body sweep with a wavy iridescent ripple.
        float t = 0.5 * uv.x + 0.62 * (1.0 - uv.y) + 0.1 * sin(uv.x * 3.2 + uTime * 0.2) + uTime * 0.015;
        vec3 body = candyBand(t);

        // Two crossing holographic diffraction bands = the signature holo shimmer.
        float h1 = uv.x * 0.7 - uv.y * 1.15 + 0.12 * sin(uv.y * 6.0 + uTime * 0.3) + uTime * 0.05;
        float h2 = uv.x * 1.35 + uv.y * 0.55 - uTime * 0.04;
        vec3 rainbow = mix(spectrum(h1), spectrum(h2 + 0.2), 0.5);

        // Blend the rainbow into the candy body — strong enough to read as foil.
        vec3 base = mix(body, rainbow, 0.42);
        // Palette whisper so each card varies.
        base = mix(base, mix(uAccent, uAccentC, uv.x), 0.08);

        // Galaxy core: push magenta/violet behind the heart.
        float core = smoothstep(0.92, 0.12, distance(uv, vec2(0.5, 0.56)));
        base = mix(base, base * vec3(1.12, 0.86, 1.18), core * 0.3);

        // Keep it luminous like real holo foil, but hold the chroma.
        base = mix(base, vec3(1.0), 0.06);
        base = clamp(base * 1.06, 0.0, 1.0);

        // Two layers of drifting stars for a dense starfield.
        float s1 = starLayer(uv + vec2(0.0, uTime * 0.006), 22.0, 0.78, uTime);
        float s2 = starLayer(uv * 1.7 + 4.1, 31.0, 0.84, uTime * 1.35);
        float stars = clamp(s1 + s2 * 0.75, 0.0, 1.5);
        base += stars * vec3(1.0, 0.99, 0.95) * (0.85 + foilUniform * 0.5);

        // Bright diagonal holo sheen streak.
        float sheen = smoothstep(0.78, 1.0, sin((uv.x * 4.2 - uv.y * 3.0 + uTime * 0.24) * 3.14159) * 0.5 + 0.5);
        base += sheen * vec3(0.14, 0.15, 0.18);
        gl_FragColor = vec4(base, 1.0);
      }
    `,
  });
}

// Prefiltered pastel-rainbow environment so the chrome heart picks up real
// iridescent reflections instead of reading as flat matte white.
function createHoloEnvTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Candy-chrome studio. A domed metal heart samples mostly the middle latitudes
  // of this equirect map, so the pink -> magenta -> lavender -> purple candy ramp
  // lives in the middle band, a bright silver at the top, and a deep purple at the
  // bottom edge. That vertical spread is what gives the heart its liquid-chrome
  // gradient (bright top, saturated body, dark base) instead of one flat colour.
  // The candy ramp is compressed into the middle latitudes the dome actually
  // samples, so silver -> pink -> magenta -> lavender -> purple all read across
  // the heart's height instead of it looking one flat pink.
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, '#FFFFFF');
  grad.addColorStop(0.32, '#FFFFFF');
  grad.addColorStop(0.4, '#FFEAF7');
  grad.addColorStop(0.46, '#FFB4E8');
  grad.addColorStop(0.5, '#EE8EE8');
  grad.addColorStop(0.54, '#C880F0');
  grad.addColorStop(0.6, '#A96CE6');
  grad.addColorStop(0.7, '#8A58CE');
  grad.addColorStop(0.82, '#6E48B4');
  grad.addColorStop(0.94, '#5C3EA0');
  grad.addColorStop(1.0, '#523894');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Diagonal oil-slick bands add the holographic cyan/mint/gold flecks over the
  // pink-purple base, so the chrome shifts colour like real holo foil.
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-0.5);
  [['#7FFFE0', -0.16], ['#9FD0FF', 0.02], ['#FFF0A0', 0.2], ['#7FFFE0', 0.36]].forEach(([c, off]) => {
    ctx.fillStyle = c;
    ctx.fillRect(-width, off * height, 2 * width, 0.1 * height);
  });
  ctx.restore();

  // Crisp white specular streaks + pastel tints = the glinty chrome highlights.
  ctx.globalAlpha = 0.6;
  [[0.1, 0.035, '#FFFFFF'], [0.3, 0.03, '#FFE0F5'], [0.48, 0.05, '#FFFFFF'], [0.66, 0.03, '#DDF6FF'], [0.86, 0.035, '#FFFFFF']].forEach(([x, w, c]) => {
    ctx.fillStyle = c;
    ctx.fillRect(x * width, 0, w * width, height);
  });
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Holographic frame: the same rainbow diffraction as the foil, layered over a
// tinted base and driven by WORLD position so the shimmer flows continuously
// around the whole border instead of restarting on each rail.
function createHoloFrameMaterial({ baseColor, timeUniform, foilUniform, alpha = 1, rainbowMix = 0.5 }) {
  const material = new THREE.ShaderMaterial({
    transparent: alpha < 1,
    uniforms: {
      uTime: timeUniform,
      foilUniform,
      uBase: { value: new THREE.Color(baseColor) },
      uAlpha: { value: alpha },
      uRainbow: { value: rainbowMix },
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      uniform float uTime;
      uniform float foilUniform;
      uniform vec3 uBase;
      uniform float uAlpha;
      uniform float uRainbow;
      vec3 spectrum(float h) {
        return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + h));
      }
      void main() {
        // Continuous diagonal rainbow keyed to world position so the shimmer
        // flows across every rail instead of restarting per mesh.
        float h = vWorld.x * 0.6 + vWorld.y * 0.5 + uTime * 0.06;
        vec3 rainbow = spectrum(h);
        vec3 col = mix(uBase, rainbow, uRainbow + foilUniform * 0.1);
        // Bright travelling sheen band for the shiny holo edge.
        float sheen = smoothstep(0.55, 1.0, sin((vWorld.x + vWorld.y) * 6.0 + uTime * 0.5) * 0.5 + 0.5);
        col += sheen * vec3(0.22, 0.2, 0.24);
        col = mix(col, vec3(1.0), 0.08);
        gl_FragColor = vec4(col, uAlpha);
      }
    `,
  });
  if (alpha < 1) material.depthWrite = false;
  return material;
}

function createRoundedPlate({
  name,
  width,
  height,
  depth,
  radius,
  material,
  x = 0,
  y = 0,
  z = 0,
  rotationZ = 0,
  bevelSize = 0.018,
}) {
  const mesh = new THREE.Mesh(
    createRoundedSlabGeometry(width, height, depth, radius, bevelSize),
    material,
  );
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotationZ;
  return mesh;
}

function createDisc({ name, radius, depth, material, x = 0, y = 0, z = 0 }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 48), material);
  mesh.name = name;
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  return mesh;
}

function addOutline(parent, mesh, color = ink, opacity = 0.38) {
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  outline.name = `${mesh.name}Outline`;
  outline.position.copy(mesh.position);
  outline.rotation.copy(mesh.rotation);
  outline.scale.copy(mesh.scale);
  parent.add(outline);
  return outline;
}

function createSparkleMesh({ name, material, x, y, z, scale = 1, rotationZ = 0 }) {
  const mesh = new THREE.Mesh(
    createExtrudedShapeGeometry(createSparkleShape(0.11, 0.032), 0.035, 0.006, 3),
    material,
  );
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotationZ;
  mesh.scale.setScalar(scale);
  return mesh;
}

function createJellyCaseRails({ railMaterial }) {
  const jellyCaseRails = new THREE.Group();
  jellyCaseRails.name = 'jellyCaseRails';
  const jellyHighlightMaterial = createSoftVinylMaterial({
    color: '#FFFFFF',
    roughness: 0.1,
    metalness: 0,
    clearcoat: 1,
    transparent: true,
    opacity: 0.46,
  });
  jellyHighlightMaterial.depthWrite = false;

  const rails = [
    ['leftJellyRail', 0.22, 2.42, -0.98, 0, 0],
    ['rightJellyRail', 0.22, 2.42, 0.98, 0, 0],
    ['topJellyRail', 1.48, 0.18, 0, 1.33, 0],
    ['bottomJellyRail', 1.48, 0.18, 0, -1.33, 0],
  ];

  rails.forEach(([name, width, height, x, y, rotationZ]) => {
    const rail = createRoundedPlate({
      name,
      width,
      height,
      depth: 0.11,
      radius: 0.08,
      material: railMaterial,
      x,
      y,
      z: 0.2,
      rotationZ,
      bevelSize: 0.035,
    });
    const highlight = createRoundedPlate({
      name: `${name}SoftHighlight`,
      width: width * 0.42,
      height: height * 0.74,
      depth: 0.012,
      radius: Math.min(width, height) * 0.2,
      material: jellyHighlightMaterial,
      x: x - width * 0.12,
      y: y + height * 0.08,
      z: 0.27,
      rotationZ,
      bevelSize: 0.004,
    });
    jellyCaseRails.add(rail, highlight);
    addOutline(jellyCaseRails, rail, brand, 0.12);
  });

  return jellyCaseRails;
}

function createGumdropCornerGuards({ pinkMaterial }) {
  const gumdropCornerGuards = new THREE.Group();
  gumdropCornerGuards.name = 'gumdropCornerGuards';
  const guardHighlightMaterial = createSoftVinylMaterial({
    color: '#FFFFFF',
    roughness: 0.12,
    metalness: 0,
    clearcoat: 1,
    transparent: true,
    opacity: 0.58,
  });

  [-1, 1].forEach((signX) => {
    [-1, 1].forEach((signY) => {
      const guardGroup = new THREE.Group();
      guardGroup.name = `gumdropCornerGuard${signX > 0 ? 'Right' : 'Left'}${signY > 0 ? 'Top' : 'Bottom'}`;

      const horizontalGuard = createRoundedPlate({
        name: 'horizontalGuard',
        width: 0.6,
        height: 0.24,
        depth: 0.16,
        radius: 0.13,
        material: pinkMaterial,
        x: signX * 0.66,
        y: signY * 1.28,
        z: 0.34,
        bevelSize: 0.046,
      });
      const verticalGuard = createRoundedPlate({
        name: 'verticalGuard',
        width: 0.24,
        height: 0.62,
        depth: 0.16,
        radius: 0.13,
        material: pinkMaterial,
        x: signX * 0.91,
        y: signY * 1.02,
        z: 0.35,
        bevelSize: 0.046,
      });
      const elbow = createDisc({
        name: 'gumdropElbow',
        radius: 0.18,
        depth: 0.165,
        material: pinkMaterial,
        x: signX * 0.81,
        y: signY * 1.18,
        z: 0.36,
      });
      const guardGloss = createRoundedPlate({
        name: 'gumdropCornerGloss',
        width: 0.26,
        height: 0.052,
        depth: 0.014,
        radius: 0.026,
        material: guardHighlightMaterial,
        x: signX * 0.72,
        y: signY * 1.34,
        z: 0.45,
        rotationZ: signX * signY * -0.22,
        bevelSize: 0.004,
      });

      guardGroup.add(horizontalGuard, verticalGuard, elbow, guardGloss);
      addOutline(guardGroup, horizontalGuard, brand, 0.18);
      addOutline(guardGroup, verticalGuard, brand, 0.18);
      addOutline(guardGroup, elbow, brand, 0.16);
      gumdropCornerGuards.add(guardGroup);
    });
  });

  return gumdropCornerGuards;
}

function createChromeHeartToyCard({
  palette,
  timeUniform,
  foilUniform,
  name,
  rarityLabel,
  traitLine,
  envMap = null,
}) {
  const chromeHeartPreset = new THREE.Group();
  chromeHeartPreset.name = 'chromeHeartPreset';
  chromeHeartPreset.userData = { name, rarityLabel, traitLine };

  const holoMaterial = createHoloFoilMaterial({ palette, timeUniform, foilUniform });
  const backHoloMaterial = createHoloFoilMaterial({ palette, timeUniform, foilUniform });
  const pinkMaterial = createSoftVinylMaterial({
    color: '#FF7DB5',
    clearcoat: 1,
    emissive: '#FF3D9A',
    emissiveIntensity: 0.12,
  });
  const mintMaterial = createSoftVinylMaterial({
    color: '#79D4C8',
    roughness: 0.3,
    clearcoat: 0.9,
    emissive: '#62D6FF',
    emissiveIntensity: 0.08,
  });
  const lavenderMaterial = createSoftVinylMaterial({
    color: '#D9CAFF',
    roughness: 0.32,
    clearcoat: 0.9,
    emissive: brand,
    emissiveIntensity: 0.06,
  });
  // Clear toploader rails carry a translucent holographic sheen — the galaxy
  // runs through the glass frame, not just the card behind it.
  const railMaterial = createHoloFrameMaterial({
    baseColor: '#FFE4F5',
    timeUniform,
    foilUniform,
    alpha: 0.5,
    rainbowMix: 0.42,
  });

  const chromeMaterial = new THREE.MeshPhysicalMaterial({
    color: '#FBF6FF',
    roughness: 0.05,
    metalness: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    iridescence: 0.75,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [180, 680],
    envMap,
    envMapIntensity: 1.15,
    emissive: '#E4D6FF',
    emissiveIntensity: 0.01,
  });
  // Bright pearlescent raised lip around the heart — the embossed border in 2D.
  const heartRimMaterial = createSoftVinylMaterial({
    color: '#FBEFFF',
    roughness: 0.18,
    metalness: 0.35,
    clearcoat: 1,
    emissive: '#FFFFFF',
    emissiveIntensity: 0.12,
  });
  // polygonOffset biases the flat face decals forward in the depth buffer so
  // they never z-fight (flicker) against the curved chrome surface behind them.
  const cheekMaterial = new THREE.MeshBasicMaterial({ color: '#F26299', transparent: true, opacity: 0.82, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -6 });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#141020', polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -6 });
  const whiteShineMaterial = new THREE.MeshBasicMaterial({
    color: '#FFFFFF',
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const yellowShineMaterial = createSoftVinylMaterial({
    color: '#FFF3A6',
    roughness: 0.22,
    clearcoat: 0.9,
    emissive: '#FFB84D',
    emissiveIntensity: 0.18,
  });
  const purplePlateMaterial = createSoftVinylMaterial({
    color: brand,
    roughness: 0.28,
    clearcoat: 0.9,
    emissive: palette[0],
    emissiveIntensity: 0.06,
  });
  const creamMaterial = createSoftVinylMaterial({ color: '#FFF3D1', roughness: 0.34, clearcoat: 0.75 });

  // All front card art lives in one group so the back can be an exact clone.
  const cardFront = new THREE.Group();
  cardFront.name = 'cardFront';

  const frontToyCardFace = createRoundedPlate({
    name: 'frontToyCardFace',
    width: 1.52,
    height: 2.18,
    depth: 0.07,
    radius: 0.15,
    material: holoMaterial,
    z: 0.13,
    bevelSize: 0.02,
  });
  cardFront.add(frontToyCardFace);
  addOutline(cardFront, frontToyCardFace, brand, 0.2);

  const frontCandyFrame = new THREE.Group();
  frontCandyFrame.name = 'frontCandyFrame';
  const frameMaterial = createHoloFrameMaterial({ baseColor: '#FF4FA6', timeUniform, foilUniform });
  const innerFrameMaterial = createHoloFrameMaterial({ baseColor: '#9B5CFF', timeUniform, foilUniform });
  // Outer magenta template border, matched insets so it reads as one clean rectangle.
  [
    ['topCandyRail', 1.2, 0.085, 0, 0.9, frameMaterial],
    ['bottomCandyRail', 1.2, 0.085, 0, -0.9, frameMaterial],
    ['leftCandyRail', 0.085, 1.78, -0.6, 0, frameMaterial],
    ['rightCandyRail', 0.085, 1.78, 0.6, 0, frameMaterial],
    // Thin inner purple line for the double-border card-template look.
    ['topInnerRail', 0.98, 0.045, 0, 0.74, innerFrameMaterial],
    ['bottomInnerRail', 0.98, 0.045, 0, -0.74, innerFrameMaterial],
    ['leftInnerRail', 0.045, 1.46, -0.48, 0, innerFrameMaterial],
    ['rightInnerRail', 0.045, 1.46, 0.48, 0, innerFrameMaterial],
  ].forEach(([frameName, width, height, x, y, material]) => {
    const frameMesh = createRoundedPlate({
      name: frameName,
      width,
      height,
      depth: 0.035,
      radius: 0.03,
      material,
      x,
      y,
      z: 0.24,
      bevelSize: 0.01,
    });
    frontCandyFrame.add(frameMesh);
    addOutline(frontCandyFrame, frameMesh, ink, 0.22);
  });
  cardFront.add(frontCandyFrame);

  const pastelStickerSparkles = new THREE.Group();
  pastelStickerSparkles.name = 'pastelStickerSparkles';
  const sparkleMaterials = [
    createSoftVinylMaterial({ color: '#FFFFFF', roughness: 0.16, metalness: 0.04, clearcoat: 1, emissive: '#FFFFFF', emissiveIntensity: 0.22 }),
    createSoftVinylMaterial({ color: '#FFF6E4', roughness: 0.2, metalness: 0.04, clearcoat: 1, emissive: '#FFF0C4', emissiveIntensity: 0.18 }),
    createSoftVinylMaterial({ color: '#FFEBFA', roughness: 0.2, metalness: 0.04, clearcoat: 1, emissive: '#FFD9F2', emissiveIntensity: 0.16 }),
  ];
  [
    [-0.38, 0.78, 0.68, 0.12],
    [0.44, 0.72, 0.82, -0.08],
    [-0.52, -0.52, 0.86, 0.16],
    [0.56, -0.44, 0.66, -0.18],
    [-0.1, -0.8, 0.5, 0.12],
    [0.1, 0.56, 0.44, 0.36],
    [0.5, 0.16, 0.4, 0.2],
    [-0.56, 0.2, 0.38, -0.24],
    [0.28, -0.66, 0.36, 0.3],
    [-0.28, 0.44, 0.34, -0.14],
    [0.0, 0.86, 0.42, 0.0],
  ].forEach(([x, y, scale, rotationZ], index) => {
    pastelStickerSparkles.add(createSparkleMesh({
      name: `pastelStickerSparkle${index + 1}`,
      material: sparkleMaterials[index % sparkleMaterials.length],
      x,
      y,
      z: 0.31 + index * 0.002,
      scale,
      rotationZ,
    }));
  });
  cardFront.add(pastelStickerSparkles);

  const topMedallion = new THREE.Group();
  topMedallion.name = 'topSparkleMedallion';
  const medallion = createDisc({
    name: 'pinkMedallionBase',
    radius: 0.21,
    depth: 0.11,
    material: pinkMaterial,
    x: -0.47,
    y: 0.78,
    z: 0.37,
  });
  const medallionRim = createDisc({
    name: 'chromeMedallionRim',
    radius: 0.25,
    depth: 0.065,
    material: chromeMaterial,
    x: -0.47,
    y: 0.78,
    z: 0.34,
  });
  const medallionSparkle = createSparkleMesh({
    name: 'medallionSparkle',
    material: yellowShineMaterial,
    x: -0.47,
    y: 0.78,
    z: 0.45,
    scale: 0.82,
  });
  topMedallion.add(medallionRim, medallion, medallionSparkle);
  addOutline(topMedallion, medallionRim, ink, 0.42);
  cardFront.add(topMedallion);

  const raisedChromeHeart = new THREE.Group();
  raisedChromeHeart.name = 'raisedChromeHeart';

  // Main body: a deeply-domed puffy heart. The big front bevel is what makes the
  // metal reflect a full top-to-bottom gradient (liquid chrome), not one colour.
  const domedHeartGeometry = new THREE.ExtrudeGeometry(createPuffyHeartShape(), {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.07,
    bevelSegments: 16,
    curveSegments: 52,
    steps: 1,
  });
  domedHeartGeometry.center();
  const heartBody = new THREE.Mesh(domedHeartGeometry, chromeMaterial);
  heartBody.name = 'chromeHeartBody';
  heartBody.position.set(0, 0, 0.2);
  heartBody.scale.set(0.82, 0.82, 1);
  raisedChromeHeart.add(heartBody);

  // Soft studio-gloss highlights on the upper lobes (broad falloff + bright core).
  const glossCoreMaterial = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -8 });
  const glossSoftMaterial = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -8 });
  const bigGloss = new THREE.Mesh(new THREE.CircleGeometry(0.14, 40), glossSoftMaterial);
  bigGloss.position.set(-0.19, 0.19, 0.5);
  bigGloss.scale.set(1, 1.5, 1);
  bigGloss.rotation.z = -0.5;
  raisedChromeHeart.add(bigGloss);
  const bigGlossCore = new THREE.Mesh(new THREE.CircleGeometry(0.06, 32), glossCoreMaterial);
  bigGlossCore.position.set(-0.21, 0.23, 0.505);
  bigGlossCore.scale.set(1, 1.6, 1);
  bigGlossCore.rotation.z = -0.5;
  raisedChromeHeart.add(bigGlossCore);
  const rightGloss = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), glossSoftMaterial);
  rightGloss.position.set(0.21, 0.27, 0.49);
  rightGloss.scale.set(1, 1.3, 1);
  raisedChromeHeart.add(rightGloss);

  // ----- Kawaii face (flat decals on the chrome front) -----
  const eyeShineMaterial = new THREE.MeshBasicMaterial({ color: '#FFFFFF', polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -10 });
  const eyeGeo = new THREE.CircleGeometry(0.088, 44);
  const cheekGeo = new THREE.CircleGeometry(0.078, 40);
  const shineGeo = new THREE.CircleGeometry(0.03, 28);
  const shineSmallGeo = new THREE.CircleGeometry(0.013, 16);
  const faceParts = [];
  [['leftEye', -0.16], ['rightEye', 0.16]].forEach(([eyeName, ex]) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMaterial);
    eye.name = eyeName;
    eye.position.set(ex, 0.04, 0.49);
    eye.scale.set(0.86, 1.16, 1);
    faceParts.push(eye);
    // one clean catchlight upper-left + a tiny one lower-right
    const shine = new THREE.Mesh(shineGeo, eyeShineMaterial);
    shine.position.set(ex - 0.036, 0.085, 0.502);
    faceParts.push(shine);
    const shineSmall = new THREE.Mesh(shineSmallGeo, eyeShineMaterial);
    shineSmall.position.set(ex + 0.032, -0.005, 0.502);
    faceParts.push(shineSmall);
  });
  [['leftCheek', -0.3], ['rightCheek', 0.3]].forEach(([cheekName, cx]) => {
    const cheek = new THREE.Mesh(cheekGeo, cheekMaterial);
    cheek.name = cheekName;
    cheek.position.set(cx, -0.1, 0.44);
    cheek.scale.set(1.28, 0.8, 1);
    faceParts.push(cheek);
  });
  raisedChromeHeart.add(...faceParts);

  const smileCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.09, -0.085, 0.5),
    new THREE.Vector3(0, -0.16, 0.5),
    new THREE.Vector3(0.09, -0.085, 0.5),
  );
  const smile = new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 24, 0.014, 8, false), eyeMaterial);
  smile.name = 'heartSmile';
  raisedChromeHeart.add(smile);

  // Puffy chrome heart, sized to sit inside the inner frame border. The z-scale
  // keeps the dome depth reasonable while the metal still reads as liquid chrome.
  raisedChromeHeart.scale.set(0.86, 0.86, 0.62);
  cardFront.add(raisedChromeHeart);

  // Nameplate: pink border, purple inset, and a light ticket label inside it —
  // sits in the lower area of the card like the 2D.
  const bottomBadgePlate = new THREE.Group();
  bottomBadgePlate.name = 'bottomBadgePlate';
  const badgeBase = createRoundedPlate({
    name: 'badgeBase',
    width: 0.4,
    height: 0.155,
    depth: 0.06,
    radius: 0.075,
    material: pinkMaterial,
    x: 0.3,
    y: -0.56,
    z: 0.34,
    bevelSize: 0.016,
  });
  const badgeInset = createRoundedPlate({
    name: 'badgeInset',
    width: 0.29,
    height: 0.085,
    depth: 0.028,
    radius: 0.04,
    material: purplePlateMaterial,
    x: 0.3,
    y: -0.56,
    z: 0.4,
    bevelSize: 0.008,
  });
  const badgeLabel = createRoundedPlate({
    name: 'badgeLabel',
    width: 0.2,
    height: 0.052,
    depth: 0.018,
    radius: 0.022,
    material: creamMaterial,
    x: 0.3,
    y: -0.56,
    z: 0.44,
    bevelSize: 0.005,
  });
  bottomBadgePlate.add(badgeBase, badgeInset, badgeLabel);
  addOutline(bottomBadgePlate, badgeBase, ink, 0.22);
  cardFront.add(bottomBadgePlate);

  const toyShelfDetails = new THREE.Group();
  toyShelfDetails.name = 'toyShelfDetails';
  // Three little status dots directly below the nameplate.
  const statusDotMaterial = createSoftVinylMaterial({ color: '#FFF3D1', roughness: 0.3, clearcoat: 0.85, emissive: '#FFE9B0', emissiveIntensity: 0.12 });
  [0.22, 0.3, 0.38].forEach((x, index) => {
    toyShelfDetails.add(createDisc({
      name: `statusDot${index + 1}`,
      radius: 0.018,
      depth: 0.014,
      material: statusDotMaterial,
      x,
      y: -0.67,
      z: 0.34,
    }));
  });
  cardFront.add(toyShelfDetails);

  chromeHeartPreset.add(cardFront);
  // No separate back panel: from behind, the blank holographic back of the
  // card face shows through and the front art is occluded by it.

  chromeHeartPreset.add(createJellyCaseRails({ railMaterial }));
  chromeHeartPreset.add(createGumdropCornerGuards({ pinkMaterial }));

  return chromeHeartPreset;
}

function cardPresetFor() {
  return createChromeHeartToyCard;
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }

  if (!material) return;
  Object.values(material).forEach((value) => {
    if (value?.isTexture) value.dispose();
  });
  material.dispose?.();
}

function disposeScene(scene) {
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) disposeMaterial(object.material);
  });
}

export default function HoloSlab3D({ item = {} }) {
  const mountRef = useRef(null);
  const traitList = useMemo(() => traitsOf(item), [item]);
  const palette = useMemo(() => paletteFor(item), [item]);
  const name = item.name ?? 'Holo Find';
  const rarityLabel = item.rarityLabel ?? String(item.rarity ?? 'Ultra Rare').toUpperCase();
  const traitLine = traitList.slice(0, 2).join(' / ');
  const itemId = item.id ?? item.name ?? 'chrome-heart-preset';

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || typeof window === 'undefined') return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return undefined;
    }

    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    mount.appendChild(canvas);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Prefilter a pastel-rainbow environment for the chrome/glass reflections.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envSource = createHoloEnvTexture();
    const envMap = pmrem.fromEquirectangular(envSource).texture;
    envSource.dispose();
    pmrem.dispose();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.04, 6.2);

    const slabGroup = new THREE.Group();
    slabGroup.rotation.x = -0.08;
    slabGroup.rotateY(0.12);
    scene.add(slabGroup);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 48),
      new THREE.MeshBasicMaterial({ color: '#171326', transparent: true, opacity: 0.16, depthWrite: false }),
    );
    shadow.scale.set(1.45, 0.25, 1);
    shadow.position.set(0.1, -1.7, -0.42);
    slabGroup.add(shadow);

    const caseGeometry = createRoundedSlabGeometry(2.12, 3.08, 0.24, 0.22, 0.035);
    const caseMaterial = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      roughness: 0.14,
      metalness: 0.02,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      transmission: 0.6,
      thickness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [200, 720],
      envMap,
      envMapIntensity: 1.35,
    });
    const caseMesh = new THREE.Mesh(caseGeometry, caseMaterial);
    slabGroup.add(caseMesh);

    const edgeLines = new THREE.LineSegments(
      new THREE.EdgesGeometry(caseGeometry),
      new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.2 }),
    );
    slabGroup.add(edgeLines);

    const timeUniform = { value: 0 };
    const foilUniform = { value: 0.45 };
    const chromeHeartPreset = cardPresetFor(itemId)({
      palette,
      timeUniform,
      foilUniform,
      name,
      rarityLabel,
      traitLine,
      envMap,
    });
    slabGroup.add(chromeHeartPreset);

    // Front and back share names (back is a clone), so collect every copy and
    // animate them together to keep the two faces identical.
    const raisedHearts = [];
    const sparkleGroups = [];
    chromeHeartPreset.traverse((object) => {
      if (object.name === 'raisedChromeHeart') raisedHearts.push(object);
      if (object.name === 'pastelStickerSparkles') sparkleGroups.push(object);
    });

    const shineBand = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 2.62),
      new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    shineBand.position.set(-0.52, 0.02, 0.58);
    shineBand.rotation.z = -0.46;
    slabGroup.add(shineBand);

    scene.add(new THREE.AmbientLight('#FFFFFF', 1.55));
    scene.add(new THREE.HemisphereLight('#FFFFFF', palette[0], 1.25));

    const keyLight = new THREE.DirectionalLight('#FFFFFF', 2.9);
    keyLight.position.set(-2.4, 3.2, 4.3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#D5F5FF', 1.5);
    rimLight.position.set(2.5, 0.5, -3.2);
    scene.add(rimLight);

    const pinkLight = new THREE.PointLight(palette[0], 2.1, 7);
    pinkLight.position.set(-2.5, 1.2, 2.4);
    scene.add(pinkLight);

    const tealLight = new THREE.PointLight(palette[2], 1.8, 7);
    tealLight.position.set(2.4, -1.2, 2.6);
    scene.add(tealLight);

    const targetRotation = { x: -0.08, y: 0.12 };
    const spinRotation = { y: 0.12 };
    const dragState = { active: false, pointerId: null, lastX: 0 };
    let frameId = 0;
    let disposed = false;
    let reducedMotion = false;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (reducedMotion) renderer.render(scene, camera);
    };

    const renderFrame = (now = 0) => {
      const t = reducedMotion ? 0 : now * 0.001;
      timeUniform.value = t;
      foilUniform.value = reducedMotion
        ? 0.38
        : 0.46 + Math.abs(targetRotation.y) * 0.72 + (Math.sin(t * 1.8) + 1) * 0.035;

      slabGroup.rotation.x += (targetRotation.x - slabGroup.rotation.x) * (reducedMotion ? 1 : 0.11);
      slabGroup.rotation.y += (targetRotation.y - slabGroup.rotation.y) * (reducedMotion ? 1 : 0.11);
      chromeHeartPreset.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.012;
      chromeHeartPreset.position.y = reducedMotion ? 0 : Math.sin(t * 1.15) * 0.018;

      // Base lift keeps each heart proud of the inner frame at every angle;
      // the sin term is just a gentle bob on top of that.
      const heartLift = 0.12 + (reducedMotion ? 0 : Math.sin(t * 1.55) * 0.014);
      raisedHearts.forEach((heart) => {
        heart.position.z = heartLift;
      });

      sparkleGroups.forEach((group) => {
        group.children.forEach((sparkle, index) => {
          sparkle.rotation.z += reducedMotion ? 0 : 0.003 + index * 0.0009;
          sparkle.scale.z = reducedMotion ? 1 : 1 + Math.sin(t * 2.2 + index) * 0.08;
        });
      });

      shineBand.position.x = reducedMotion ? -0.45 : -0.45 + Math.sin(t * 1.25) * 0.52;
      shineBand.material.opacity = reducedMotion ? 0.12 : 0.13 + Math.abs(Math.sin(t * 1.7)) * 0.11;

      renderer.render(scene, camera);
    };

    const animate = (now) => {
      if (disposed || reducedMotion) return;
      renderFrame(now);
      frameId = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      renderFrame(0);
    };

    const handlePointerDown = (event) => {
      if (reducedMotion) return;
      dragState.active = true;
      dragState.pointerId = event.pointerId;
      dragState.lastX = event.clientX;
      mount.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
      if (reducedMotion) return;

      const bounds = mount.getBoundingClientRect();
      const xPercent = (event.clientX - bounds.left) / bounds.width - 0.5;
      const yPercent = (event.clientY - bounds.top) / bounds.height - 0.5;
      targetRotation.x = THREE.MathUtils.clamp(-yPercent * 0.32 - 0.06, -0.26, 0.22);
      if (dragState.active) {
        const deltaX = event.clientX - dragState.lastX;
        dragState.lastX = event.clientX;
        spinRotation.y += deltaX * 0.018;
        targetRotation.y = spinRotation.y;
      } else {
        targetRotation.y = spinRotation.y + xPercent * 0.18;
      }
    };

    const handlePointerUp = (event) => {
      if (dragState.pointerId !== null && dragState.pointerId !== event.pointerId) return;
      dragState.active = false;
      dragState.pointerId = null;
      spinRotation.y = targetRotation.y;
      mount.releasePointerCapture?.(event.pointerId);
    };

    const handlePointerLeave = () => {
      targetRotation.x = -0.08;
      if (!dragState.active) targetRotation.y = spinRotation.y;
    };

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => {
      reducedMotion = Boolean(motionQuery?.matches);
      if (reducedMotion) stopAnimation();
      else startAnimation();
    };

    mount.addEventListener('pointerdown', handlePointerDown);
    mount.addEventListener(POINTER_EVENT_NAME, handlePointerMove);
    mount.addEventListener('pointerup', handlePointerUp);
    mount.addEventListener('pointercancel', handlePointerUp);
    mount.addEventListener('pointerleave', handlePointerLeave);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
    } else {
      window.addEventListener('resize', resize);
    }

    if (typeof motionQuery?.addEventListener === 'function') {
      motionQuery.addEventListener('change', updateMotionPreference);
    } else {
      motionQuery?.addListener?.(updateMotionPreference);
    }

    resize();
    updateMotionPreference();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      mount.removeEventListener('pointerdown', handlePointerDown);
      mount.removeEventListener(POINTER_EVENT_NAME, handlePointerMove);
      mount.removeEventListener('pointerup', handlePointerUp);
      mount.removeEventListener('pointercancel', handlePointerUp);
      mount.removeEventListener('pointerleave', handlePointerLeave);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);

      if (typeof motionQuery?.removeEventListener === 'function') {
        motionQuery.removeEventListener('change', updateMotionPreference);
      } else {
        motionQuery?.removeListener?.(updateMotionPreference);
      }

      disposeScene(scene);
      envMap.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();

      if (canvas.parentNode === mount) {
        mount.removeChild(canvas);
      }
    };
  }, [itemId, name, rarityLabel, traitLine, palette]);

  return (
    <div
      ref={mountRef}
      aria-label={`${name} holographic slab preview`}
      data-renderer="three-canvas"
      data-pointer-event={POINTER_EVENT_NAME}
      data-spin-axis="360-yaw"
      style={s('position:relative;height:318px;border-radius:24px;background:radial-gradient(circle at 18% 12%,#FFFFFF 0 0,#D5F5FF 24%,#F7D7FF 54%,#FFF0B8 100%);border:2px solid #fff;display:block;overflow:hidden;box-shadow:inset 0 -22px 44px rgba(106,90,205,.14),0 7px 0 rgba(106,90,205,.12);touch-action:none;cursor:grab')}
    />
  );
}
