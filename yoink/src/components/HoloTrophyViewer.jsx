import { useEffect, useMemo, useRef, useState } from 'react';
import HoloSlab3D from './HoloSlab3D.jsx';
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const {
  ink,
  wash,
  line,
  muted,
  brand,
  attentionBadgeBackground,
  attentionBadgeText,
} = marketTheme;

const noop = () => {};
const FALLBACK_RARITY_LABEL = 'ULTRA RARE';
const FALLBACK_TRAITS = ['rainbow foil frame', 'chunky toy slab', 'sparkle flecks'];

function textOf(value, fallback) {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function traitsOf(traits) {
  if (!Array.isArray(traits)) return FALLBACK_TRAITS;
  const cleanTraits = traits.map((trait) => String(trait).trim()).filter(Boolean);
  return cleanTraits.length > 0 ? cleanTraits : FALLBACK_TRAITS;
}

export default function HoloTrophyViewer({ item = null, onClose = noop }) {
  const [activeHotspot, setActiveHotspot] = useState('rarity');
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const trophy = useMemo(() => {
    if (!item) return null;
    const traits = traitsOf(item.traits);
    const rarityLabel = textOf(item.rarity, FALLBACK_RARITY_LABEL).toUpperCase();

    return {
      ...item,
      name: textOf(item.name ?? item.title, 'Holo Find'),
      rarityLabel,
      editionLabel: textOf(item.editionLabel, 'Pocket edition'),
      ownedLabel: textOf(item.ownedLabel, 'owned 1'),
      traits,
      traitsLabel: traits.join(', '),
    };
  }, [item]);

  const hotspots = useMemo(() => {
    if (!trophy) return [];
    return [
      {
        id: 'rarity',
        label: 'Rarity',
        value: trophy.rarityLabel,
        detail: `${trophy.rarityLabel} finish with a loud holo badge and toy-shelf glow.`,
      },
      {
        id: 'edition',
        label: 'Edition',
        value: trophy.editionLabel,
        detail: `${trophy.editionLabel} in your Pocket, marked ${trophy.ownedLabel}.`,
      },
      {
        id: 'traits',
        label: 'Traits',
        value: `${trophy.traits.length} traits`,
        detail: trophy.traitsLabel,
      },
    ];
  }, [trophy]);

  useEffect(() => {
    setActiveHotspot('rarity');
  }, [item?.id]);

  useEffect(() => {
    if (!item || typeof document === 'undefined') return undefined;

    previousFocusRef.current = document.activeElement;
    dialogRef.current?.focus?.();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const dialog = dialogRef.current;
        const focusable = Array.from(dialog?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])
          .filter((node) => !node.disabled && node.getAttribute('aria-hidden') !== 'true');

        if (focusable.length === 0) {
          event.preventDefault();
          dialog?.focus?.();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
  }, [item, onClose]);

  if (!trophy) return null;

  const activeDetail = hotspots.find((hotspot) => hotspot.id === activeHotspot) ?? hotspots[0];

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${trophy.name} trophy viewer`}
      tabIndex={-1}
      style={s('position:absolute;inset:0;z-index:960;background:radial-gradient(circle at 14% 18%,rgba(255,228,241,.72),transparent 26%),radial-gradient(circle at 86% 8%,rgba(255,243,209,.78),transparent 24%),linear-gradient(180deg,rgba(23,19,38,.46),rgba(23,19,38,.64));display:flex;align-items:flex-end;justify-content:center;padding:14px;animation:ypop .18s ease both;outline:none;overflow:hidden')}
    >
      <div
        role="presentation"
        aria-hidden="true"
        onClick={onClose}
        style={s('position:absolute;inset:0;border:0;background:transparent;cursor:pointer')}
      />

      <div style={s('position:relative;width:100%;max-height:calc(100% - 8px);overflow:auto;border-radius:28px 28px 22px 22px;background:linear-gradient(180deg,#FFFFFF 0%,#F9F6FF 54%,#E7F8FF 100%);border:2px solid #FFFFFF;padding:15px 14px 16px;box-shadow:0 12px 0 rgba(255,184,77,.26),0 22px 46px rgba(23,19,38,.32);font-family:\'Nunito\',sans-serif;color:#171326;z-index:1')}>
        <div style={s('pointer-events:none;position:absolute;left:-32px;right:-32px;top:72px;height:56px;background:repeating-linear-gradient(135deg,rgba(255,214,234,.50) 0 11px,rgba(213,245,255,.50) 11px 22px,rgba(255,240,184,.50) 22px 33px);transform:rotate(-7deg);opacity:.75')} />
        <button
          type="button"
          aria-label="Close trophy viewer"
          onClick={onClose}
          style={s(`position:absolute;top:12px;right:12px;width:36px;height:36px;border:0;border-radius:14px;background:${wash};display:flex;align-items:center;justify-content:center;color:${ink};cursor:pointer;z-index:3;box-shadow:0 4px 0 #DCD5EF`)}
        >
          <span className="mi" style={s('font-size:21px')}>close</span>
        </button>

        <div style={s('position:relative;z-index:1;display:flex;flex-direction:column;gap:13px')}>
          <div style={s('display:flex;align-items:flex-start;gap:10px;padding-right:42px')}>
            <span style={s(`width:42px;height:42px;border-radius:15px;background:${attentionBadgeBackground};color:${attentionBadgeText};display:flex;align-items:center;justify-content:center;box-shadow:0 5px 0 rgba(255,184,77,.38);flex:none`)}>
              <span className="mi" style={s("font-size:25px;font-variation-settings:'FILL' 1")}>workspace_premium</span>
            </span>
            <div style={s('min-width:0;flex:1')}>
              <div style={s(`font:900 23px/1.02 'Fredoka';color:${ink};overflow-wrap:anywhere`)}>{trophy.name}</div>
              <div style={s('margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
                <span style={s('display:inline-flex;align-items:center;gap:4px;border-radius:999px;background:#FF3D9A;color:#fff;font:900 10.5px \'Fredoka\';padding:5px 8px;box-shadow:0 3px 0 rgba(194,24,106,.32)')}>
                  <span className="mi" style={s("font-size:13px;font-variation-settings:'FILL' 1")}>auto_awesome</span>
                  {trophy.rarityLabel}
                </span>
                <span style={s(`border-radius:999px;background:#FFF3D1;color:${ink};font:900 10.5px 'Nunito';padding:5px 8px`)}>
                  {trophy.ownedLabel}
                </span>
              </div>
            </div>
          </div>

          <HoloSlab3D item={trophy} />

          <div style={s(`display:flex;align-items:center;justify-content:center;gap:6px;border-radius:16px;background:#fff;border:1.5px solid ${line};padding:9px 10px;color:${muted};font:900 11.5px 'Nunito';box-shadow:0 4px 0 rgba(106,90,205,.08)`)}>
            <span className="mi" style={s(`font-size:16px;color:${brand}`)}>open_with</span>
            Drag to rotate
            <span style={s('color:#D2CCE8')}>/</span>
            tilt to shimmer
          </div>

          <div style={s('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px')}>
            {hotspots.map((hotspot) => {
              const isActive = hotspot.id === activeHotspot;
              return (
                <button
                  type="button"
                  key={hotspot.id}
                  aria-pressed={isActive}
                  onClick={() => setActiveHotspot(hotspot.id)}
                  style={s(`min-width:0;border:1.5px solid ${isActive ? brand : line};border-radius:16px;background:${isActive ? brand : '#fff'};color:${isActive ? '#fff' : ink};padding:9px 7px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;box-shadow:0 4px 0 ${isActive ? '#4B3BA6' : 'rgba(106,90,205,.08)'}`)}
                >
                  <span style={s(`font:900 9.5px 'Fredoka';text-transform:uppercase;white-space:nowrap`)}>{hotspot.label}</span>
                  <span style={s("font:900 10.5px/1.05 'Nunito';max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{hotspot.value}</span>
                </button>
              );
            })}
          </div>

          <div style={s(`border-radius:18px;background:#fff;border:1.5px solid ${line};padding:12px 12px 11px;box-shadow:0 5px 0 rgba(106,90,205,.10)`)}>
            <div style={s(`font:900 11px 'Fredoka';color:${brand};text-transform:uppercase`)}>{activeDetail.label}</div>
            <div role="status" style={s(`margin-top:5px;font:800 13px/1.35 'Nunito';color:${ink}`)}>
              {activeDetail.detail}
            </div>
          </div>

          <div style={s('display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap')}>
            <span style={s(`border-radius:999px;background:${wash};border:1px solid ${line};color:${muted};font:900 11px 'Nunito';padding:6px 9px`)}>
              {trophy.editionLabel}
            </span>
            <span style={s('border-radius:999px;background:#C7F5EC;color:#047E70;font:900 11px \'Fredoka\';padding:6px 9px')}>
              {trophy.traits.length} traits
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
