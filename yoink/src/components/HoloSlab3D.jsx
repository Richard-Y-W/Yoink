import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, line, brand } = marketTheme;

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

function createStarShape(outerRadius, innerRadius) {
  const shape = new THREE.Shape();
  const points = 10;

  for (let i = 0; i < points; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (i / points) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  shape.closePath();
  return shape;
}

function fitText(ctx, text, maxWidth) {
  const cleanText = String(text).trim();
  if (ctx.measureText(cleanText).width <= maxWidth) return cleanText;

  let output = cleanText;
  while (output.length > 4 && ctx.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1);
  }

  return `${output.trim()}...`;
}

function roundedCanvasRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function createLabelTexture({ name, rarityLabel, traitLine, palette }) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#FFFFFF');
  gradient.addColorStop(0.34, '#FFF3D1');
  gradient.addColorStop(0.68, '#E5FAFF');
  gradient.addColorStop(1, '#F6E6FF');

  roundedCanvasRect(ctx, 22, 24, 596, 312, 48);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 9;
  ctx.strokeStyle = line;
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 11; i += 1) {
    ctx.fillStyle = palette[i % palette.length];
    ctx.beginPath();
    ctx.arc(82 + i * 54, 78 + Math.sin(i * 1.9) * 22, 9 + (i % 3) * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = ink;
  ctx.font = "900 34px Fredoka, Arial, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(fitText(ctx, rarityLabel, 438), 320, 92);

  ctx.font = "900 50px Fredoka, Arial, sans-serif";
  ctx.fillText(fitText(ctx, name, 520), 320, 256);

  ctx.font = "900 24px Nunito, Arial, sans-serif";
  ctx.fillStyle = '#6F6A80';
  ctx.fillText(fitText(ctx, traitLine, 500), 320, 298);

  ctx.fillStyle = brand;
  ctx.beginPath();
  ctx.arc(542, 82, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "900 28px Fredoka, Arial, sans-serif";
  ctx.fillText('*', 542, 92);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
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
      roughness: 0.24,
      metalness: 0.02,
      transparent: true,
      opacity: 0.46,
      transmission: 0.34,
      thickness: 0.45,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
    const caseMesh = new THREE.Mesh(caseGeometry, caseMaterial);
    slabGroup.add(caseMesh);

    const edgeLines = new THREE.LineSegments(
      new THREE.EdgesGeometry(caseGeometry),
      new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.76 }),
    );
    slabGroup.add(edgeLines);

    const timeUniform = { value: 0 };
    const foilUniform = { value: 0.45 };
    const accentColor = new THREE.Color(palette[0]);
    const secondAccentColor = new THREE.Color(palette[1]);
    const foilMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: timeUniform,
        foilUniform,
        uAccent: { value: accentColor },
        uAccentB: { value: secondAccentColor },
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
        void main() {
          float stripe = sin((vUv.x * 7.0 + vUv.y * 5.5 + uTime * 0.9) * 3.14159);
          float narrowShine = smoothstep(0.79, 1.0, sin((vUv.x + vUv.y * 0.8 + uTime * 0.18) * 18.0) * 0.5 + 0.5);
          vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.32, 0.68) + vUv.x * 0.72 + vUv.y * 0.38 + uTime * 0.05));
          vec3 base = mix(vec3(0.95, 0.98, 1.0), uAccent, 0.24 + stripe * 0.08);
          vec3 candy = mix(base, uAccentB, 0.24 + vUv.y * 0.2);
          vec3 color = mix(candy, rainbow, 0.36 + foilUniform * 0.24);
          color += narrowShine * foilUniform * vec3(0.54, 0.62, 0.78);
          gl_FragColor = vec4(color, 0.93);
        }
      `,
    });

    const foilFace = new THREE.Mesh(
      createRoundedSlabGeometry(1.62, 2.16, 0.035, 0.14, 0.012),
      foilMaterial,
    );
    foilFace.position.z = 0.16;
    slabGroup.add(foilFace);

    const labelTexture = createLabelTexture({ name, rarityLabel, traitLine, palette });
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.43, 0.8),
      new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true }),
    );
    label.position.set(0, -0.55, 0.21);
    slabGroup.add(label);

    const shineBand = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 2.42),
      new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    shineBand.position.set(-0.5, 0.02, 0.24);
    shineBand.rotation.z = -0.46;
    slabGroup.add(shineBand);

    const starGeometry = new THREE.ExtrudeGeometry(createStarShape(0.46, 0.2), {
      depth: 0.13,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 4,
    });
    starGeometry.center();
    const star = new THREE.Mesh(
      starGeometry,
      new THREE.MeshStandardMaterial({
        color: palette[2],
        metalness: 0.18,
        roughness: 0.28,
        emissive: palette[0],
        emissiveIntensity: 0.18,
      }),
    );
    star.position.set(0, 0.48, 0.34);
    star.rotation.z = -0.06;
    slabGroup.add(star);

    const starBack = new THREE.Mesh(
      new THREE.CircleGeometry(0.54, 44),
      new THREE.MeshBasicMaterial({ color: palette[1], transparent: true, opacity: 0.24, depthWrite: false }),
    );
    starBack.position.set(0, 0.48, 0.28);
    slabGroup.add(starBack);

    const cornerGeometry = new THREE.CylinderGeometry(0.095, 0.095, 0.07, 28);
    const cornerPositions = [
      [-0.83, 1.25, palette[0]],
      [0.83, 1.25, palette[1]],
      [-0.83, -1.25, palette[2]],
      [0.83, -1.25, brand],
    ];

    cornerPositions.forEach(([x, y, color], index) => {
      const corner = new THREE.Mesh(
        cornerGeometry,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.36,
          metalness: 0.08,
          emissive: color,
          emissiveIntensity: 0.05,
        }),
      );
      corner.rotation.x = Math.PI / 2;
      corner.position.set(x, y, 0.31);
      corner.scale.set(1, index % 2 === 0 ? 1.18 : 0.92, 1);
      slabGroup.add(corner);
    });

    const sparkleGeometry = new THREE.CircleGeometry(0.035, 5);
    const sparkleMaterials = palette.map((color) => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.64,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));

    for (let i = 0; i < 22; i += 1) {
      const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterials[i % sparkleMaterials.length]);
      const x = Math.sin(i * 12.9898) * 1.5;
      const y = Math.cos(i * 78.233) * 1.95;
      sparkle.position.set(x, y, -0.08 + (i % 3) * 0.12);
      sparkle.scale.setScalar(0.45 + (i % 4) * 0.28);
      sparkle.rotation.z = i * 0.38;
      slabGroup.add(sparkle);
    }

    scene.add(new THREE.AmbientLight('#FFFFFF', 1.55));
    scene.add(new THREE.HemisphereLight('#FFFFFF', palette[0], 1.25));

    const keyLight = new THREE.DirectionalLight('#FFFFFF', 2.7);
    keyLight.position.set(-2.4, 3.2, 4.3);
    scene.add(keyLight);

    const pinkLight = new THREE.PointLight(palette[0], 2.1, 7);
    pinkLight.position.set(-2.5, 1.2, 2.4);
    scene.add(pinkLight);

    const tealLight = new THREE.PointLight(palette[2], 1.8, 7);
    tealLight.position.set(2.4, -1.2, 2.6);
    scene.add(tealLight);

    const targetRotation = { x: -0.08, y: 0.12 };
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
      star.rotation.z = reducedMotion ? -0.06 : -0.06 + Math.sin(t * 1.45) * 0.08;
      star.position.z = reducedMotion ? 0.34 : 0.34 + Math.sin(t * 1.9) * 0.025;
      shineBand.position.x = reducedMotion ? -0.45 : -0.45 + Math.sin(t * 1.25) * 0.52;
      shineBand.material.opacity = reducedMotion ? 0.2 : 0.24 + Math.abs(Math.sin(t * 1.7)) * 0.18;

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

    const handlePointerMove = (event) => {
      if (reducedMotion) return;

      const bounds = mount.getBoundingClientRect();
      const xPercent = (event.clientX - bounds.left) / bounds.width - 0.5;
      const yPercent = (event.clientY - bounds.top) / bounds.height - 0.5;
      targetRotation.x = THREE.MathUtils.clamp(-yPercent * 0.32 - 0.06, -0.26, 0.22);
      targetRotation.y = THREE.MathUtils.clamp(xPercent * 0.46, -0.34, 0.34);
    };

    const handlePointerLeave = () => {
      targetRotation.x = -0.08;
      targetRotation.y = 0.12;
    };

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => {
      reducedMotion = Boolean(motionQuery?.matches);
      if (reducedMotion) stopAnimation();
      else startAnimation();
    };

    mount.addEventListener(POINTER_EVENT_NAME, handlePointerMove);
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
      mount.removeEventListener(POINTER_EVENT_NAME, handlePointerMove);
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
  }, [name, rarityLabel, traitLine, palette]);

  return (
    <div
      ref={mountRef}
      aria-label={`${name} holographic slab preview`}
      data-renderer="three-canvas"
      data-pointer-event={POINTER_EVENT_NAME}
      style={s('position:relative;height:318px;border-radius:24px;background:radial-gradient(circle at 18% 12%,#FFFFFF 0 0,#D5F5FF 24%,#F7D7FF 54%,#FFF0B8 100%);border:2px solid #fff;display:block;overflow:hidden;box-shadow:inset 0 -22px 44px rgba(106,90,205,.14),0 7px 0 rgba(106,90,205,.12);touch-action:none')}
    />
  );
}
