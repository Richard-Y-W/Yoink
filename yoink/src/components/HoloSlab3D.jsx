import { useEffect, useMemo, useState } from 'react';
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, wash, line, brand } = marketTheme;

const POINTER_EVENT_NAME = 'pointermove';
const DEFAULT_TRAITS = ['rainbow foil frame', 'chunky toy slab', 'sparkle flecks'];

function traitsOf(item) {
  const traits = Array.isArray(item?.traits) ? item.traits : DEFAULT_TRAITS;
  const cleanTraits = traits.map((trait) => String(trait).trim()).filter(Boolean);
  return cleanTraits.length > 0 ? cleanTraits : DEFAULT_TRAITS;
}

export default function HoloSlab3D({ item = {} }) {
  const [tilt, setTilt] = useState({ x: -4, y: 8 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setIsReducedMotion(motionQuery.matches);
    updateMotionPreference();

    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', updateMotionPreference);
      return () => motionQuery.removeEventListener('change', updateMotionPreference);
    }

    motionQuery.addListener?.(updateMotionPreference);
    return () => motionQuery.removeListener?.(updateMotionPreference);
  }, []);

  const traitList = useMemo(() => traitsOf(item), [item]);
  const foilUniform = isReducedMotion ? 0.32 : 0.46 + Math.abs(tilt.y) / 70;
  const imageBackground = item.imageUrl ? '#fff' : item.imageStripe || item.stripe || wash;

  const handlePointerMove = (event) => {
    if (isReducedMotion) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const xPercent = (event.clientX - bounds.left) / bounds.width - 0.5;
    const yPercent = (event.clientY - bounds.top) / bounds.height - 0.5;

    setTilt({
      x: Number((-yPercent * 12).toFixed(2)),
      y: Number((xPercent * 16).toFixed(2)),
    });
  };

  const resetTilt = () => {
    setTilt({ x: -4, y: 8 });
  };

  return (
    <div
      aria-label={`${item.name ?? 'Holo Find'} holographic slab preview`}
      data-future-renderer="canvas"
      data-pointer-event={POINTER_EVENT_NAME}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      style={s('position:relative;height:318px;border-radius:24px;background:radial-gradient(circle at 18% 12%,#FFFFFF 0 0,#D5F5FF 24%,#F7D7FF 54%,#FFF0B8 100%);border:2px solid #fff;display:flex;align-items:center;justify-content:center;perspective:760px;overflow:hidden;box-shadow:inset 0 -22px 44px rgba(106,90,205,.14),0 7px 0 rgba(106,90,205,.12)')}
    >
      <div style={s('position:absolute;inset:-44px;background:repeating-linear-gradient(120deg,rgba(255,255,255,.16) 0 9px,rgba(255,61,154,.16) 9px 18px,rgba(16,181,160,.16) 18px 27px,rgba(255,184,77,.16) 27px 36px);transform:rotate(10deg);opacity:.9')} />
      <div
        style={s(`position:relative;width:190px;height:272px;border-radius:25px;background:linear-gradient(180deg,#FFFFFF 0%,#F3F0FF 100%);border:2px solid ${line};padding:10px;display:flex;flex-direction:column;gap:9px;transform:rotateX(${tilt.x}deg) rotateY(${tilt.y}deg);transform-style:preserve-3d;transition:${isReducedMotion ? 'none' : 'transform .12s ease-out'};box-shadow:0 12px 0 rgba(75,59,166,.16),0 22px 36px rgba(23,19,38,.22)`)}>
        <div style={s(`height:34px;border-radius:15px;background:#FFF3D1;border:1.5px solid ${line};display:flex;align-items:center;justify-content:space-between;gap:7px;padding:0 9px;box-shadow:inset 0 -6px 12px rgba(255,184,77,.16)`)}>
          <span style={s(`min-width:0;font:900 10.5px 'Fredoka';color:${ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>
            {item.rarityLabel ?? String(item.rarity ?? 'Ultra Rare').toUpperCase()}
          </span>
          <span className="mi" style={s(`font-size:16px;color:${brand};font-variation-settings:'FILL' 1`)}>stars</span>
        </div>

        <div style={s(`position:relative;flex:1;border-radius:20px;background:${imageBackground};border:1.5px solid ${line};display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:inset 0 0 0 4px rgba(255,255,255,.55)`)}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name ?? 'Holo Find'} style={s('width:100%;height:100%;object-fit:cover;display:block')} />
          ) : (
            <span className="mi" style={s(`font-size:64px;color:${brand};font-variation-settings:'FILL' 1`)}>auto_awesome</span>
          )}
          <span style={s(`pointer-events:none;position:absolute;inset:-38px;background:linear-gradient(${115 + tilt.y}deg,transparent 18%,rgba(255,255,255,${foilUniform}) 44%,rgba(213,245,255,.38) 52%,transparent 74%);mix-blend-mode:screen`)} />
        </div>

        <div style={s('min-height:50px;display:flex;flex-direction:column;justify-content:center;text-align:center')}>
          <span style={s(`font:900 16px/1.04 'Fredoka';color:${ink};overflow-wrap:anywhere`)}>
            {item.name ?? 'Holo Find'}
          </span>
          <span style={s("margin-top:5px;font:900 9.5px 'Nunito';color:#8C8A99;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
            {traitList.slice(0, 2).join(' / ')}
          </span>
        </div>
      </div>
    </div>
  );
}
