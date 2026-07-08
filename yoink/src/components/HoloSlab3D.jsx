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

function createHeartShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.44);
  shape.bezierCurveTo(-0.62, -0.1, -0.62, 0.38, -0.2, 0.36);
  shape.bezierCurveTo(-0.08, 0.36, -0.02, 0.29, 0, 0.21);
  shape.bezierCurveTo(0.02, 0.29, 0.08, 0.36, 0.2, 0.36);
  shape.bezierCurveTo(0.62, 0.38, 0.62, -0.1, 0, -0.44);
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
      void main() {
        float stripe = sin((vUv.x * 8.5 + vUv.y * 5.7 + uTime * 0.75) * 3.14159);
        float sparkle = smoothstep(0.68, 1.0, sin((vUv.x * 19.0 - vUv.y * 13.0 + uTime * 1.4) * 3.14159) * 0.5 + 0.5);
        float diagonal = smoothstep(0.78, 1.0, sin((vUv.x + vUv.y + uTime * 0.16) * 23.0) * 0.5 + 0.5);
        vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.34, 0.68) + vUv.x * 0.72 + vUv.y * 0.44 + uTime * 0.045));
        vec3 candy = mix(uAccent, uAccentB, 0.42 + stripe * 0.18);
        candy = mix(candy, uAccentC, vUv.y * 0.22);
        vec3 color = mix(candy, rainbow, 0.38 + foilUniform * 0.2);
        color += diagonal * vec3(0.42, 0.48, 0.7);
        color += sparkle * 0.12;
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

function createTransparentCaseRails({ railMaterial, outlineMaterial }) {
  const transparentCaseRails = new THREE.Group();
  transparentCaseRails.name = 'transparentCaseRails';

  const rails = [
    ['leftRail', 0.17, 2.54, -1.0, 0, 0],
    ['rightRail', 0.17, 2.54, 1.0, 0, 0],
    ['topRail', 1.48, 0.14, 0, 1.36, 0],
    ['bottomRail', 1.48, 0.14, 0, -1.36, 0],
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
      bevelSize: 0.025,
    });
    transparentCaseRails.add(rail);
    addOutline(transparentCaseRails, rail, outlineMaterial.color, 0.22);
  });

  return transparentCaseRails;
}

function createPinkCornerGuards({ pinkMaterial }) {
  const pinkCornerGuards = new THREE.Group();
  pinkCornerGuards.name = 'pinkCornerGuards';

  [-1, 1].forEach((signX) => {
    [-1, 1].forEach((signY) => {
      const guardGroup = new THREE.Group();
      guardGroup.name = `pinkCornerGuard${signX > 0 ? 'Right' : 'Left'}${signY > 0 ? 'Top' : 'Bottom'}`;

      const horizontalGuard = createRoundedPlate({
        name: 'horizontalGuard',
        width: 0.56,
        height: 0.2,
        depth: 0.14,
        radius: 0.1,
        material: pinkMaterial,
        x: signX * 0.68,
        y: signY * 1.28,
        z: 0.34,
        bevelSize: 0.035,
      });
      const verticalGuard = createRoundedPlate({
        name: 'verticalGuard',
        width: 0.2,
        height: 0.58,
        depth: 0.14,
        radius: 0.1,
        material: pinkMaterial,
        x: signX * 0.91,
        y: signY * 1.04,
        z: 0.35,
        bevelSize: 0.035,
      });
      const elbow = createDisc({
        name: 'roundedGuardElbow',
        radius: 0.15,
        depth: 0.145,
        material: pinkMaterial,
        x: signX * 0.82,
        y: signY * 1.19,
        z: 0.36,
      });

      guardGroup.add(horizontalGuard, verticalGuard, elbow);
      addOutline(guardGroup, horizontalGuard, ink, 0.5);
      addOutline(guardGroup, verticalGuard, ink, 0.5);
      addOutline(guardGroup, elbow, ink, 0.5);
      pinkCornerGuards.add(guardGroup);
    });
  });

  return pinkCornerGuards;
}

function createChromeHeartSculptedCard({
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

  const darkLineMaterial = new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.42 });
  const holoMaterial = createHoloFoilMaterial({ palette, timeUniform, foilUniform });
  const reverseHoloMaterial = createHoloFoilMaterial({ palette, timeUniform, foilUniform });
  const pinkMaterial = createToonMaterial({
    color: '#FF7DB5',
    roughness: 0.22,
    metalness: 0.04,
    clearcoat: 1,
    emissive: '#FF3D9A',
    emissiveIntensity: 0.08,
  });
  const railMaterial = createToonMaterial({
    color: '#FFFFFF',
    roughness: 0.08,
    metalness: 0.02,
    clearcoat: 1,
    transparent: true,
    opacity: 0.42,
  });
  railMaterial.depthWrite = false;

  const chromeMaterial = createToonMaterial({
    color: '#FDF7FF',
    roughness: 0.16,
    metalness: 0.46,
    clearcoat: 1,
    emissive: '#B8F6FF',
    emissiveIntensity: 0.12,
  });
  const cheekMaterial = new THREE.MeshBasicMaterial({ color: '#FF6B9D' });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#171326' });
  const whiteShineMaterial = new THREE.MeshBasicMaterial({
    color: '#FFFFFF',
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const yellowShineMaterial = createToonMaterial({
    color: '#FFF3A6',
    roughness: 0.22,
    metalness: 0.08,
    clearcoat: 0.9,
    emissive: '#FFB84D',
    emissiveIntensity: 0.18,
  });
  const purplePlateMaterial = createToonMaterial({
    color: brand,
    roughness: 0.28,
    metalness: 0.08,
    clearcoat: 0.9,
    emissive: palette[0],
    emissiveIntensity: 0.06,
  });
  const creamMaterial = createToonMaterial({ color: '#FFF3D1', roughness: 0.34, metalness: 0.02, clearcoat: 0.7 });

  const reversePlate = createRoundedPlate({
    name: 'reverseHoloBack',
    width: 1.58,
    height: 2.3,
    depth: 0.06,
    radius: 0.16,
    material: reverseHoloMaterial,
    z: -0.13,
  });
  chromeHeartPreset.add(reversePlate);
  addOutline(chromeHeartPreset, reversePlate, ink, 0.42);

  const reverseHeart = new THREE.Mesh(
    createExtrudedShapeGeometry(createHeartShape(), 0.045, 0.01, 3),
    createToonMaterial({
      color: '#FFE4F1',
      roughness: 0.3,
      metalness: 0.12,
      clearcoat: 0.9,
      emissive: palette[0],
      emissiveIntensity: 0.08,
    }),
  );
  reverseHeart.name = 'reverseHeartEmboss';
  reverseHeart.position.set(0, 0.12, -0.23);
  reverseHeart.scale.set(0.8, 0.8, 1);
  chromeHeartPreset.add(reverseHeart);
  addOutline(chromeHeartPreset, reverseHeart, ink, 0.18);

  const reverseSerialDots = new THREE.Group();
  reverseSerialDots.name = 'reverseSerialDots';
  [
    ['reverseTopBand', 0, 0.86, 1.02, 0.045, palette[2]],
    ['reverseBottomBand', 0, -0.86, 1.02, 0.045, palette[1]],
    ['reverseLeftBand', -0.52, 0, 0.045, 1.42, palette[0]],
    ['reverseRightBand', 0.52, 0, 0.045, 1.42, palette[2]],
  ].forEach(([detailName, x, y, width, height, color]) => {
    reverseSerialDots.add(createRoundedPlate({
      name: detailName,
      width,
      height,
      depth: 0.026,
      radius: 0.022,
      material: createToonMaterial({
        color,
        roughness: 0.24,
        metalness: 0.14,
        clearcoat: 0.9,
        emissive: color,
        emissiveIntensity: 0.1,
      }),
      x,
      y,
      z: -0.225,
      bevelSize: 0.006,
    }));
  });
  [palette[0], '#FFF3D1', palette[2], brand].forEach((color, index) => {
    reverseSerialDots.add(createDisc({
      name: `reverseDot${index + 1}`,
      radius: 0.032,
      depth: 0.018,
      material: createToonMaterial({ color, roughness: 0.28, clearcoat: 0.8, emissive: color, emissiveIntensity: 0.08 }),
      x: -0.21 + index * 0.14,
      y: -1.02,
      z: -0.24,
    }));
  });
  chromeHeartPreset.add(reverseSerialDots);

  const holoCardFace = createRoundedPlate({
    name: 'holoCardFace',
    width: 1.52,
    height: 2.18,
    depth: 0.07,
    radius: 0.15,
    material: holoMaterial,
    z: 0.13,
    bevelSize: 0.02,
  });
  chromeHeartPreset.add(holoCardFace);
  addOutline(chromeHeartPreset, holoCardFace, ink, 0.54);

  const innerFrame = new THREE.Group();
  innerFrame.name = 'rainbowCircuitFrame';
  [
    ['topFrame', 1.24, 0.045, 0, 0.9, palette[2]],
    ['bottomFrame', 1.2, 0.045, -0.06, -0.9, palette[1]],
    ['leftFrame', 0.045, 1.65, -0.62, -0.02, palette[0]],
    ['rightFrame', 0.045, 1.65, 0.62, 0.02, palette[2]],
  ].forEach(([frameName, width, height, x, y, color]) => {
    const frameMesh = createRoundedPlate({
      name: frameName,
      width,
      height,
      depth: 0.035,
      radius: 0.025,
      material: createToonMaterial({
        color,
        roughness: 0.2,
        metalness: 0.18,
        clearcoat: 0.9,
        emissive: color,
        emissiveIntensity: 0.09,
      }),
      x,
      y,
      z: 0.24,
      bevelSize: 0.008,
    });
    innerFrame.add(frameMesh);
  });
  chromeHeartPreset.add(innerFrame);

  const sparkleRelief = new THREE.Group();
  sparkleRelief.name = 'sparkleRelief';
  const sparkleMaterials = [
    yellowShineMaterial,
    createToonMaterial({ color: '#FCEBFF', roughness: 0.2, metalness: 0.12, clearcoat: 1, emissive: '#FFFFFF', emissiveIntensity: 0.12 }),
    createToonMaterial({ color: '#A7F5FF', roughness: 0.24, metalness: 0.12, clearcoat: 1, emissive: '#62D6FF', emissiveIntensity: 0.16 }),
    createToonMaterial({ color: '#FF9BD1', roughness: 0.24, metalness: 0.08, clearcoat: 1, emissive: '#FF3D9A', emissiveIntensity: 0.12 }),
  ];
  [
    [-0.36, 0.76, 0.78, 0.12],
    [0.42, 0.72, 1.08, -0.08],
    [-0.5, -0.55, 1.18, 0.16],
    [0.55, -0.46, 0.82, -0.18],
    [-0.06, -0.78, 0.64, 0.12],
    [0.08, 0.54, 0.52, 0.36],
  ].forEach(([x, y, scale, rotationZ], index) => {
    sparkleRelief.add(createSparkleMesh({
      name: `raisedSparkle${index + 1}`,
      material: sparkleMaterials[index % sparkleMaterials.length],
      x,
      y,
      z: 0.31 + index * 0.002,
      scale,
      rotationZ,
    }));
  });
  chromeHeartPreset.add(sparkleRelief);

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
    createExtrudedShapeGeometry(createHeartShape(), 0.11, 0.024, 5),
    createToonMaterial({ color: '#4C2B60', roughness: 0.38, metalness: 0.06, clearcoat: 0.65 }),
  );
  heartShadow.name = 'heartDarkRim';
  heartShadow.position.set(0.02, -0.02, 0.33);
  heartShadow.scale.set(1.08, 1.08, 1);
  raisedChromeHeart.add(heartShadow);

  const heartBody = new THREE.Mesh(
    createExtrudedShapeGeometry(createHeartShape(), 0.16, 0.035, 7),
    chromeMaterial,
  );
  heartBody.name = 'chromeHeartBody';
  heartBody.position.set(0, 0, 0.42);
  raisedChromeHeart.add(heartBody);

  const heartHighlight = createRoundedPlate({
    name: 'heartWhiteHighlight',
    width: 0.12,
    height: 0.58,
    depth: 0.01,
    radius: 0.06,
    material: whiteShineMaterial,
    x: -0.22,
    y: 0.08,
    z: 0.525,
    rotationZ: -0.52,
    bevelSize: 0.004,
  });
  raisedChromeHeart.add(heartHighlight);

  const faceParts = [
    createDisc({ name: 'leftEye', radius: 0.052, depth: 0.012, material: eyeMaterial, x: -0.18, y: 0.03, z: 0.53 }),
    createDisc({ name: 'rightEye', radius: 0.052, depth: 0.012, material: eyeMaterial, x: 0.18, y: 0.03, z: 0.53 }),
    createDisc({ name: 'leftCheek', radius: 0.07, depth: 0.01, material: cheekMaterial, x: -0.33, y: -0.12, z: 0.532 }),
    createDisc({ name: 'rightCheek', radius: 0.07, depth: 0.01, material: cheekMaterial, x: 0.33, y: -0.12, z: 0.532 }),
  ];
  raisedChromeHeart.add(...faceParts);

  const smileCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.075, -0.08, 0.535),
    new THREE.Vector3(0, -0.145, 0.535),
    new THREE.Vector3(0.075, -0.08, 0.535),
  );
  const smile = new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 16, 0.01, 8, false), eyeMaterial);
  smile.name = 'heartSmile';
  raisedChromeHeart.add(smile);

  chromeHeartPreset.add(raisedChromeHeart);

  const bottomBadgePlate = new THREE.Group();
  bottomBadgePlate.name = 'bottomBadgePlate';
  const badgeBase = createRoundedPlate({
    name: 'badgeBase',
    width: 0.62,
    height: 0.27,
    depth: 0.08,
    radius: 0.11,
    material: chromeMaterial,
    x: 0.39,
    y: -0.86,
    z: 0.34,
    bevelSize: 0.02,
  });
  const badgeInset = createRoundedPlate({
    name: 'badgeInset',
    width: 0.46,
    height: 0.16,
    depth: 0.035,
    radius: 0.07,
    material: purplePlateMaterial,
    x: 0.39,
    y: -0.86,
    z: 0.41,
    bevelSize: 0.012,
  });
  const badgeSparkle = createSparkleMesh({
    name: 'badgeSparkle',
    material: yellowShineMaterial,
    x: 0.22,
    y: -0.86,
    z: 0.445,
    scale: 0.55,
    rotationZ: 0.12,
  });
  bottomBadgePlate.add(badgeBase, badgeInset, badgeSparkle);
  addOutline(bottomBadgePlate, badgeBase, ink, 0.45);
  chromeHeartPreset.add(bottomBadgePlate);

  const tinyCardDetails = new THREE.Group();
  tinyCardDetails.name = 'tinyCardDetails';
  [
    ['leftSerialLineA', -0.47, -0.88, 0.2],
    ['leftSerialLineB', -0.5, -0.97, 0.15],
    ['leftSerialLineC', -0.43, -0.97, 0.11],
  ].forEach(([detailName, x, y, width]) => {
    tinyCardDetails.add(createRoundedPlate({
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
    tinyCardDetails.add(createDisc({
      name: `serialDot${index + 1}`,
      radius: 0.024,
      depth: 0.018,
      material: createToonMaterial({ color, roughness: 0.3, clearcoat: 0.8, emissive: color, emissiveIntensity: 0.1 }),
      x: 0.18 + index * 0.12,
      y: -1.08,
      z: 0.34,
    }));
  });
  chromeHeartPreset.add(tinyCardDetails);

  chromeHeartPreset.add(createTransparentCaseRails({ railMaterial, outlineMaterial: darkLineMaterial }));
  chromeHeartPreset.add(createPinkCornerGuards({ pinkMaterial }));

  return chromeHeartPreset;
}

function cardPresetFor() {
  return createChromeHeartSculptedCard;
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
    const sparkleRelief = chromeHeartPreset.getObjectByName('sparkleRelief');

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

      sparkleRelief?.children.forEach((sparkle, index) => {
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
