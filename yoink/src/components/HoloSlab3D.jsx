import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, brand } = marketTheme;

const DEFAULT_TRAITS = ['slabbed foil card', 'chrome heart icon', 'rainbow shimmer'];
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

function createReferenceHeartShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.58);
  shape.bezierCurveTo(-0.52, -0.34, -0.78, -0.02, -0.68, 0.27);
  shape.bezierCurveTo(-0.58, 0.58, -0.2, 0.59, -0.05, 0.31);
  shape.bezierCurveTo(-0.02, 0.24, 0.02, 0.24, 0.05, 0.31);
  shape.bezierCurveTo(0.2, 0.59, 0.58, 0.58, 0.68, 0.27);
  shape.bezierCurveTo(0.78, -0.02, 0.52, -0.34, 0, -0.58);
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

function createIridescentChromeMaterial({
  color = '#FFF8FF',
  emissive = '#B8F6FF',
  emissiveIntensity = 0.16,
  metalness = 0.32,
  roughness = 0.14,
} = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.95,
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [120, 520],
    reflectivity: 0.9,
    sheen: 0.35,
    sheenColor: new THREE.Color('#FF7BD5'),
    emissive,
    emissiveIntensity,
  });
}

function createFoilGlitterMaterial({ palette, timeUniform, foilUniform }) {
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
      void main() {
        float bandA = sin((vUv.x * 4.8 + vUv.y * 2.4 + uTime * 0.32) * 3.14159) * 0.5 + 0.5;
        float bandB = sin((vUv.x * -2.2 + vUv.y * 5.8 - uTime * 0.18) * 3.14159) * 0.5 + 0.5;
        float diagonal = smoothstep(0.58, 0.98, sin((vUv.x + vUv.y * 0.84 + uTime * 0.1) * 31.0) * 0.5 + 0.5);
        float glitterA = smoothstep(0.93, 1.0, fract(sin(dot(floor(vUv * 62.0), vec2(12.9898, 78.233))) * 43758.5453));
        float glitterB = smoothstep(0.965, 1.0, fract(sin(dot(floor(vUv * 118.0), vec2(39.346, 11.135))) * 24634.6345));
        vec3 peach = vec3(1.0, 0.62, 0.42);
        vec3 magenta = vec3(1.0, 0.18, 0.62);
        vec3 violet = vec3(0.45, 0.22, 1.0);
        vec3 cyan = vec3(0.22, 0.92, 1.0);
        vec3 gold = vec3(1.0, 0.88, 0.28);
        vec3 deepFoil = mix(peach, magenta, bandA);
        deepFoil = mix(deepFoil, violet, bandB * 0.72);
        deepFoil = mix(deepFoil, cyan, smoothstep(0.18, 0.92, vUv.x) * 0.38);
        deepFoil = mix(deepFoil, gold, smoothstep(0.0, 1.0, vUv.y) * 0.24);
        vec3 paletteWash = mix(uAccent, uAccentB, bandA * 0.42);
        paletteWash = mix(paletteWash, uAccentC, bandB * 0.25);
        vec3 color = mix(deepFoil, paletteWash, 0.16 + foilUniform * 0.08);
        color += diagonal * vec3(0.34, 0.22, 0.32);
        color += glitterA * vec3(0.95, 0.9, 1.0);
        color += glitterB * vec3(1.0, 0.72, 0.86);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
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

function createSlimGlassRails({ railMaterial }) {
  const slimGlassRails = new THREE.Group();
  slimGlassRails.name = 'slimGlassRails';
  const glassHighlightMaterial = createSoftVinylMaterial({
    color: '#FFFFFF',
    roughness: 0.08,
    metalness: 0,
    clearcoat: 1,
    transparent: true,
    opacity: 0.58,
  });
  glassHighlightMaterial.depthWrite = false;

  const rails = [
    ['leftSlimGlassRail', 0.13, 2.42, -0.98, 0, 0],
    ['rightSlimGlassRail', 0.13, 2.42, 0.98, 0, 0],
    ['topSlimGlassRail', 1.42, 0.1, 0, 1.32, 0],
    ['bottomSlimGlassRail', 1.42, 0.1, 0, -1.32, 0],
  ];

  rails.forEach(([name, width, height, x, y, rotationZ]) => {
    const rail = createRoundedPlate({
      name,
      width,
      height,
      depth: 0.065,
      radius: 0.055,
      material: railMaterial,
      x,
      y,
      z: 0.17,
      rotationZ,
      bevelSize: 0.018,
    });
    const highlight = createRoundedPlate({
      name: `${name}SoftHighlight`,
      width: width * 0.36,
      height: height * 0.86,
      depth: 0.012,
      radius: Math.min(width, height) * 0.22,
      material: glassHighlightMaterial,
      x: x - width * 0.16,
      y: y + height * 0.04,
      z: 0.22,
      rotationZ,
      bevelSize: 0.004,
    });
    slimGlassRails.add(rail, highlight);
    addOutline(slimGlassRails, rail, ink, 0.18);
  });

  return slimGlassRails;
}

function createSlimCornerProtectors({ pinkMaterial }) {
  const slimCornerProtectors = new THREE.Group();
  slimCornerProtectors.name = 'slimCornerProtectors';
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
      guardGroup.name = `slimCornerProtector${signX > 0 ? 'Right' : 'Left'}${signY > 0 ? 'Top' : 'Bottom'}`;

      const horizontalGuard = createRoundedPlate({
        name: 'horizontalGuard',
        width: 0.52,
        height: 0.18,
        depth: 0.1,
        radius: 0.09,
        material: pinkMaterial,
        x: signX * 0.69,
        y: signY * 1.28,
        z: 0.3,
        bevelSize: 0.03,
      });
      const verticalGuard = createRoundedPlate({
        name: 'verticalGuard',
        width: 0.18,
        height: 0.54,
        depth: 0.1,
        radius: 0.09,
        material: pinkMaterial,
        x: signX * 0.91,
        y: signY * 1.05,
        z: 0.305,
        bevelSize: 0.03,
      });
      const elbow = createDisc({
        name: 'curvedProtectorElbow',
        radius: 0.135,
        depth: 0.105,
        material: pinkMaterial,
        x: signX * 0.83,
        y: signY * 1.19,
        z: 0.315,
      });
      const guardGloss = createRoundedPlate({
        name: 'cornerProtectorGloss',
        width: 0.24,
        height: 0.042,
        depth: 0.014,
        radius: 0.026,
        material: guardHighlightMaterial,
        x: signX * 0.72,
        y: signY * 1.335,
        z: 0.385,
        rotationZ: signX * signY * -0.22,
        bevelSize: 0.004,
      });

      guardGroup.add(horizontalGuard, verticalGuard, elbow, guardGloss);
      addOutline(guardGroup, horizontalGuard, ink, 0.28);
      addOutline(guardGroup, verticalGuard, ink, 0.28);
      addOutline(guardGroup, elbow, ink, 0.24);
      slimCornerProtectors.add(guardGroup);
    });
  });

  return slimCornerProtectors;
}

function createHighDetailChromeHeartCard({
  palette,
  timeUniform,
  foilUniform,
  name,
  rarityLabel,
  traitLine,
}) {
  const chromeHeartPreset = new THREE.Group();
  chromeHeartPreset.name = 'chromeHeartPreset';
  chromeHeartPreset.userData = { name, rarityLabel, traitLine };

  const holoMaterial = createFoilGlitterMaterial({ palette, timeUniform, foilUniform });
  const backHoloMaterial = createFoilGlitterMaterial({ palette, timeUniform, foilUniform });
  const pinkMaterial = createSoftVinylMaterial({
    color: '#FF8FC5',
    roughness: 0.2,
    metalness: 0.04,
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
  const railMaterial = createSoftVinylMaterial({
    color: '#FFFFFF',
    roughness: 0.06,
    clearcoat: 1,
    transparent: true,
    opacity: 0.42,
  });
  railMaterial.depthWrite = false;

  const chromeMaterial = createIridescentChromeMaterial({
    color: '#FDF7FF',
    emissive: '#D5F5FF',
    emissiveIntensity: 0.16,
  });
  const heartRimMaterial = createIridescentChromeMaterial({
    color: '#B39CFF',
    emissive: '#FF7BD5',
    emissiveIntensity: 0.1,
    metalness: 0.22,
    roughness: 0.2,
  });
  const darkRimMaterial = createSoftVinylMaterial({ color: '#24172F', roughness: 0.32, metalness: 0.02, clearcoat: 0.65 });
  const cheekMaterial = new THREE.MeshBasicMaterial({ color: '#FF6B9D' });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#171326' });
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

  const mirroredToyBack = new THREE.Group();
  mirroredToyBack.name = 'mirroredToyBack';

  const backToyCardFace = createRoundedPlate({
    name: 'backToyCardFace',
    width: 1.52,
    height: 2.16,
    depth: 0.045,
    radius: 0.18,
    material: backHoloMaterial,
    z: -0.12,
    bevelSize: 0.015,
  });
  mirroredToyBack.add(backToyCardFace);
  addOutline(mirroredToyBack, backToyCardFace, brand, 0.18);

  const referenceBackDetails = new THREE.Group();
  referenceBackDetails.name = 'referenceBackDetails';
  [
    ['backTopIridescentLine', 1.1, 0.05, 0, 0.82, pinkMaterial],
    ['backBottomIridescentLine', 1.04, 0.05, 0.02, -0.82, yellowShineMaterial],
    ['backLeftIridescentLine', 0.05, 1.46, -0.56, 0, mintMaterial],
    ['backRightIridescentLine', 0.05, 1.46, 0.56, 0, lavenderMaterial],
    ['backInnerTopLine', 0.84, 0.032, 0.04, 0.62, purplePlateMaterial],
    ['backInnerBottomLine', 0.78, 0.032, -0.04, -0.62, purplePlateMaterial],
  ].forEach(([detailName, width, height, x, y, material]) => {
    referenceBackDetails.add(createRoundedPlate({
      name: detailName,
      width,
      height,
      depth: 0.02,
      radius: 0.024,
      material,
      x,
      y,
      z: -0.205,
      bevelSize: 0.005,
    }));
  });
  mirroredToyBack.add(referenceBackDetails);

  const backToyHeart = new THREE.Mesh(
    createExtrudedShapeGeometry(createReferenceHeartShape(), 0.055, 0.012, 5),
    chromeMaterial,
  );
  backToyHeart.name = 'backToyHeart';
  backToyHeart.position.set(0, 0.08, -0.245);
  backToyHeart.scale.set(0.55, 0.55, 1);
  mirroredToyBack.add(backToyHeart);
  addOutline(mirroredToyBack, backToyHeart, brand, 0.15);

  [
    createDisc({ name: 'backLeftEye', radius: 0.032, depth: 0.012, material: eyeMaterial, x: -0.12, y: 0.08, z: -0.355 }),
    createDisc({ name: 'backRightEye', radius: 0.032, depth: 0.012, material: eyeMaterial, x: 0.12, y: 0.08, z: -0.355 }),
    createDisc({ name: 'backLeftCheek', radius: 0.042, depth: 0.01, material: cheekMaterial, x: -0.23, y: -0.03, z: -0.357 }),
    createDisc({ name: 'backRightCheek', radius: 0.042, depth: 0.01, material: cheekMaterial, x: 0.23, y: -0.03, z: -0.357 }),
  ].forEach((facePart) => mirroredToyBack.add(facePart));

  const backToySparkles = new THREE.Group();
  backToySparkles.name = 'backToySparkles';
  [
    [-0.36, 0.54, 0.58, 0.12, yellowShineMaterial],
    [0.4, 0.48, 0.5, -0.18, pinkMaterial],
    [-0.4, -0.56, 0.46, 0.28, mintMaterial],
    [0.38, -0.6, 0.54, -0.12, lavenderMaterial],
  ].forEach(([x, y, scale, rotationZ, material], index) => {
    backToySparkles.add(createSparkleMesh({
      name: `backToySparkle${index + 1}`,
      material,
      x,
      y,
      z: -0.265,
      scale,
      rotationZ,
    }));
  });
  mirroredToyBack.add(backToySparkles);

  const backToyRibbon = createRoundedPlate({
    name: 'backToyRibbon',
    width: 0.82,
    height: 0.24,
    depth: 0.032,
    radius: 0.1,
    material: creamMaterial,
    x: 0,
    y: -0.86,
    z: -0.225,
    bevelSize: 0.014,
  });
  mirroredToyBack.add(backToyRibbon);
  chromeHeartPreset.add(mirroredToyBack);

  const thinCardCore = new THREE.Group();
  thinCardCore.name = 'thinCardCore';
  const frontToyCardFace = createRoundedPlate({
    name: 'frontToyCardFace',
    width: 1.48,
    height: 2.12,
    depth: 0.045,
    radius: 0.15,
    material: holoMaterial,
    z: 0.13,
    bevelSize: 0.014,
  });
  thinCardCore.add(frontToyCardFace);
  addOutline(thinCardCore, frontToyCardFace, ink, 0.28);
  chromeHeartPreset.add(thinCardCore);

  const nestedIridescentFrame = new THREE.Group();
  nestedIridescentFrame.name = 'nestedIridescentFrame';
  [
    ['outerTopIridescentFrame', 1.14, 0.052, 0, 0.88, mintMaterial],
    ['outerBottomIridescentFrame', 1.06, 0.052, -0.04, -0.9, yellowShineMaterial],
    ['outerLeftIridescentFrame', 0.052, 1.62, -0.61, -0.02, pinkMaterial],
    ['outerRightIridescentFrame', 0.052, 1.62, 0.61, 0.02, lavenderMaterial],
    ['innerTopIridescentFrame', 0.86, 0.034, 0.08, 0.68, purplePlateMaterial],
    ['innerBottomIridescentFrame', 0.78, 0.034, -0.06, -0.68, purplePlateMaterial],
    ['innerLeftIridescentFrame', 0.034, 1.08, -0.46, -0.05, mintMaterial],
    ['innerRightIridescentFrame', 0.034, 1.08, 0.46, 0.04, pinkMaterial],
  ].forEach(([frameName, width, height, x, y, material]) => {
    const frameMesh = createRoundedPlate({
      name: frameName,
      width,
      height,
      depth: 0.024,
      radius: 0.02,
      material,
      x,
      y,
      z: 0.215,
      bevelSize: 0.006,
    });
    nestedIridescentFrame.add(frameMesh);
  });
  chromeHeartPreset.add(nestedIridescentFrame);

  const microGlitterField = new THREE.Group();
  microGlitterField.name = 'microGlitterField';
  [
    [-0.32, 0.52, 0.011, pinkMaterial],
    [-0.08, 0.58, 0.008, yellowShineMaterial],
    [0.22, 0.49, 0.01, mintMaterial],
    [0.38, 0.32, 0.007, lavenderMaterial],
    [-0.4, 0.16, 0.008, yellowShineMaterial],
    [0.46, 0.04, 0.01, pinkMaterial],
    [-0.3, -0.22, 0.007, mintMaterial],
    [0.32, -0.3, 0.008, yellowShineMaterial],
    [-0.44, -0.52, 0.01, lavenderMaterial],
    [0.1, -0.55, 0.007, pinkMaterial],
    [0.46, -0.62, 0.009, mintMaterial],
    [-0.08, 0.3, 0.006, whiteShineMaterial],
  ].forEach(([x, y, radius, material], index) => {
    microGlitterField.add(createDisc({
      name: `microGlitterFleck${index + 1}`,
      radius,
      depth: 0.006,
      material,
      x,
      y,
      z: 0.255 + index * 0.0005,
    }));
  });
  chromeHeartPreset.add(microGlitterField);

  const pastelStickerSparkles = new THREE.Group();
  pastelStickerSparkles.name = 'pastelStickerSparkles';
  const sparkleMaterials = [
    yellowShineMaterial,
    createSoftVinylMaterial({ color: '#FCEBFF', roughness: 0.2, metalness: 0.08, clearcoat: 1, emissive: '#FFFFFF', emissiveIntensity: 0.12 }),
    createSoftVinylMaterial({ color: '#A7F5FF', roughness: 0.24, metalness: 0.08, clearcoat: 1, emissive: '#62D6FF', emissiveIntensity: 0.16 }),
    createSoftVinylMaterial({ color: '#FF9BD1', roughness: 0.24, metalness: 0.04, clearcoat: 1, emissive: '#FF3D9A', emissiveIntensity: 0.12 }),
  ];
  [
    [-0.36, 0.76, 0.72, 0.12],
    [0.42, 0.72, 0.86, -0.08],
    [-0.5, -0.55, 0.9, 0.16],
    [0.55, -0.46, 0.72, -0.18],
    [-0.08, -0.78, 0.56, 0.12],
    [0.08, 0.54, 0.48, 0.36],
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
  chromeHeartPreset.add(pastelStickerSparkles);

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
  chromeHeartPreset.add(topMedallion);

  const raisedChromeHeart = new THREE.Group();
  raisedChromeHeart.name = 'raisedChromeHeart';

  const heartShadow = new THREE.Mesh(
    createExtrudedShapeGeometry(createReferenceHeartShape(), 0.07, 0.018, 7),
    darkRimMaterial,
  );
  heartShadow.name = 'heartDarkRim';
  heartShadow.position.set(0.012, -0.018, 0.335);
  heartShadow.scale.set(0.74, 0.74, 1);
  raisedChromeHeart.add(heartShadow);

  const heartChromeRim = new THREE.Mesh(
    createExtrudedShapeGeometry(createReferenceHeartShape(), 0.055, 0.014, 6),
    heartRimMaterial,
  );
  heartChromeRim.name = 'chromeHeartOuterRim';
  heartChromeRim.position.set(0, -0.006, 0.382);
  heartChromeRim.scale.set(0.69, 0.69, 1);
  raisedChromeHeart.add(heartChromeRim);

  const heartBody = new THREE.Mesh(
    createExtrudedShapeGeometry(createReferenceHeartShape(), 0.105, 0.026, 9),
    chromeMaterial,
  );
  heartBody.name = 'chromeHeartBody';
  heartBody.position.set(0, 0, 0.438);
  heartBody.scale.set(0.62, 0.62, 1);
  raisedChromeHeart.add(heartBody);

  const chromeHeartInnerGlow = new THREE.Mesh(
    createExtrudedShapeGeometry(createReferenceHeartShape(), 0.012, 0.004, 3),
    new THREE.MeshBasicMaterial({
      color: '#EFCBFF',
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  chromeHeartInnerGlow.name = 'chromeHeartInnerGlow';
  chromeHeartInnerGlow.position.set(0.02, 0.02, 0.56);
  chromeHeartInnerGlow.scale.set(0.47, 0.47, 1);
  raisedChromeHeart.add(chromeHeartInnerGlow);

  const heartHighlight = createRoundedPlate({
    name: 'heartWhiteHighlight',
    width: 0.085,
    height: 0.42,
    depth: 0.01,
    radius: 0.06,
    material: whiteShineMaterial,
    x: -0.18,
    y: 0.105,
    z: 0.59,
    rotationZ: -0.58,
    bevelSize: 0.004,
  });
  raisedChromeHeart.add(heartHighlight);

  const leftEye = createDisc({ name: 'leftEye', radius: 0.044, depth: 0.012, material: eyeMaterial, x: -0.13, y: 0.025, z: 0.61 });
  leftEye.scale.set(0.76, 1.28, 1);
  const rightEye = createDisc({ name: 'rightEye', radius: 0.044, depth: 0.012, material: eyeMaterial, x: 0.13, y: 0.025, z: 0.61 });
  rightEye.scale.set(0.76, 1.28, 1);
  const faceParts = [
    leftEye,
    rightEye,
    createDisc({ name: 'heartEyeHighlightLeft', radius: 0.014, depth: 0.006, material: whiteShineMaterial, x: -0.142, y: 0.046, z: 0.622 }),
    createDisc({ name: 'heartEyeHighlightRight', radius: 0.014, depth: 0.006, material: whiteShineMaterial, x: 0.118, y: 0.046, z: 0.622 }),
    createDisc({ name: 'leftCheek', radius: 0.05, depth: 0.01, material: cheekMaterial, x: -0.26, y: -0.09, z: 0.614 }),
    createDisc({ name: 'rightCheek', radius: 0.05, depth: 0.01, material: cheekMaterial, x: 0.26, y: -0.09, z: 0.614 }),
  ];
  raisedChromeHeart.add(...faceParts);

  const smileCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.052, -0.058, 0.626),
    new THREE.Vector3(0, -0.102, 0.626),
    new THREE.Vector3(0.052, -0.058, 0.626),
  );
  const smile = new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 16, 0.007, 8, false), eyeMaterial);
  smile.name = 'heartSmile';
  raisedChromeHeart.add(smile);

  chromeHeartPreset.add(raisedChromeHeart);

  const bottomBadgePlate = new THREE.Group();
  bottomBadgePlate.name = 'bottomBadgePlate';
  const badgeBase = createRoundedPlate({
    name: 'badgeBase',
    width: 0.58,
    height: 0.22,
    depth: 0.045,
    radius: 0.095,
    material: chromeMaterial,
    x: 0.39,
    y: -0.86,
    z: 0.325,
    bevelSize: 0.014,
  });
  const badgeInset = createRoundedPlate({
    name: 'badgeInset',
    width: 0.42,
    height: 0.12,
    depth: 0.022,
    radius: 0.055,
    material: purplePlateMaterial,
    x: 0.39,
    y: -0.86,
    z: 0.365,
    bevelSize: 0.008,
  });
  const badgeSparkle = createSparkleMesh({
    name: 'badgeSparkle',
    material: yellowShineMaterial,
    x: 0.22,
    y: -0.86,
    z: 0.392,
    scale: 0.42,
    rotationZ: 0.12,
  });
  const referenceBadgeDetails = new THREE.Group();
  referenceBadgeDetails.name = 'referenceBadgeDetails';
  [
    ['badgeLeftTab', 0.055, 0.06, 0.14, -0.86, pinkMaterial],
    ['badgeRightTab', 0.055, 0.06, 0.64, -0.86, yellowShineMaterial],
    ['badgeInnerLine', 0.24, 0.018, 0.43, -0.86, whiteShineMaterial],
  ].forEach(([detailName, width, height, x, y, material]) => {
    referenceBadgeDetails.add(createRoundedPlate({
      name: detailName,
      width,
      height,
      depth: 0.01,
      radius: 0.012,
      material,
      x,
      y,
      z: 0.397,
      bevelSize: 0.003,
    }));
  });
  bottomBadgePlate.add(badgeBase, badgeInset, badgeSparkle, referenceBadgeDetails);
  addOutline(bottomBadgePlate, badgeBase, brand, 0.18);
  chromeHeartPreset.add(bottomBadgePlate);

  const toyShelfDetails = new THREE.Group();
  toyShelfDetails.name = 'toyShelfDetails';
  [
    ['leftCandyDashA', -0.47, -0.88, 0.2],
    ['leftCandyDashB', -0.5, -0.97, 0.15],
    ['leftCandyDashC', -0.43, -0.97, 0.11],
  ].forEach(([detailName, x, y, width]) => {
    toyShelfDetails.add(createRoundedPlate({
      name: detailName,
      width,
      height: 0.032,
      depth: 0.02,
      radius: 0.016,
      material: creamMaterial,
      x,
      y,
      z: 0.34,
      bevelSize: 0.004,
    }));
  });
  [palette[0], palette[1], palette[2]].forEach((color, index) => {
    toyShelfDetails.add(createDisc({
      name: `toyPebble${index + 1}`,
      radius: 0.024,
      depth: 0.018,
      material: createSoftVinylMaterial({ color, roughness: 0.3, clearcoat: 0.8, emissive: color, emissiveIntensity: 0.1 }),
      x: 0.18 + index * 0.12,
      y: -1.08,
      z: 0.34,
    }));
  });
  chromeHeartPreset.add(toyShelfDetails);

  chromeHeartPreset.add(createSlimGlassRails({ railMaterial }));
  chromeHeartPreset.add(createSlimCornerProtectors({ pinkMaterial }));

  return chromeHeartPreset;
}

function cardPresetFor() {
  return createHighDetailChromeHeartCard;
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
      roughness: 0.2,
      metalness: 0.02,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      transmission: 0.42,
      thickness: 0.45,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
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
    });
    slabGroup.add(chromeHeartPreset);

    const raisedChromeHeart = chromeHeartPreset.getObjectByName('raisedChromeHeart');
    const pastelStickerSparkles = chromeHeartPreset.getObjectByName('pastelStickerSparkles');

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

      if (raisedChromeHeart) {
        raisedChromeHeart.position.z = reducedMotion ? 0 : Math.sin(t * 1.55) * 0.018;
      }

      pastelStickerSparkles?.children.forEach((sparkle, index) => {
        sparkle.rotation.z += reducedMotion ? 0 : 0.003 + index * 0.0009;
        sparkle.scale.z = reducedMotion ? 1 : 1 + Math.sin(t * 2.2 + index) * 0.08;
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
