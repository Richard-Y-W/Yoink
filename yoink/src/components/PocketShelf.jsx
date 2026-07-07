import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, wash, line, muted, brand, attentionBadgeBackground, attentionBadgeText } = marketTheme;

const noop = () => {};

function clampSelectedIndex(selectedIndex, itemCount) {
  if (itemCount <= 0) return 0;
  return Math.max(0, Math.min(selectedIndex, itemCount - 1));
}

function shelfCardStyle({ offset, isActive }) {
  const distance = Math.abs(offset);
  const rotateY = offset === 0 ? 0 : offset < 0 ? -24 : 24;
  const translateX = offset * 76;
  const scale = isActive ? 1 : 0.82 - Math.min(distance - 1, 1) * 0.08;
  const opacity = distance > 2 ? 0 : isActive ? 1 : 0.82;
  const zIndex = 20 - distance;

  return s(`position:absolute;left:50%;top:${isActive ? '10px' : '42px'};width:${isActive ? '202px' : '136px'};height:${isActive ? '284px' : '214px'};border:0;border-radius:${isActive ? '24px' : '19px'};padding:${isActive ? '10px' : '8px'};background:#fff;box-shadow:${isActive ? '0 9px 0 rgba(106,90,205,.16),0 14px 30px rgba(23,19,38,.18)' : '0 5px 0 rgba(106,90,205,.10),0 8px 18px rgba(23,19,38,.10)'};cursor:pointer;transform:translateX(calc(-50% + ${translateX}px)) scale(${scale}) rotateY(${rotateY}deg);transform-style:preserve-3d;transition:transform .24s ease, opacity .2s ease, top .24s ease;opacity:${opacity};z-index:${zIndex};display:flex;flex-direction:column;align-items:stretch;text-align:left`);
}

function activeCardContentStyle(isActive) {
  return s(`display:flex;flex:1;min-height:0;flex-direction:column;align-items:stretch;${isActive ? 'animation:ypop .34s ease both;' : ''}`);
}

function ItemImage({ item, isActive }) {
  const imageBackground = item.imageUrl ? '#fff' : item.imageStripe || item.stripe || wash;
  return (
    <div style={s(`position:relative;height:${isActive ? '168px' : '112px'};border-radius:${isActive ? '18px' : '14px'};background:${imageBackground};border:1.5px solid ${line};overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 -14px 28px rgba(106,90,205,.10)`)}>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} style={s('width:100%;height:100%;object-fit:cover;display:block')} />
      ) : (
        <span className="mi" style={s(`font-size:${isActive ? '52px' : '35px'};color:${brand};font-variation-settings:'FILL' 1`)}>auto_awesome</span>
      )}
      <span style={s(`position:absolute;left:8px;top:8px;display:inline-flex;align-items:center;gap:3px;border-radius:999px;background:${attentionBadgeBackground};color:${attentionBadgeText};font:900 ${isActive ? '10px' : '8.5px'} 'Fredoka';padding:3px 7px;box-shadow:0 2px 0 rgba(255,184,77,.38)`)}>
        <span className="mi" style={s(`font-size:${isActive ? '12px' : '10px'};font-variation-settings:'FILL' 1`)}>stars</span>
        HOLO
      </span>
    </div>
  );
}

function PocketShelfCard({ item, index, offset, isActive, onSelect, onOpen }) {
  const label = isActive ? 'Open trophy viewer' : `Select ${item.name}`;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      onClick={() => {
        if (isActive) {
          onOpen(item);
        } else {
          onSelect(index);
        }
      }}
      style={shelfCardStyle({ offset, isActive })}
    >
      <span style={activeCardContentStyle(isActive)}>
        <ItemImage item={item} isActive={isActive} />
        <span style={s(`min-height:${isActive ? '74px' : '55px'};display:flex;flex-direction:column;justify-content:space-between;margin-top:${isActive ? '10px' : '7px'}`)}>
          <span style={s(`font:900 ${isActive ? '18px' : '11.5px'}/1.04 'Fredoka';color:${ink};max-height:${isActive ? '40px' : '25px'};overflow:hidden;text-align:${isActive ? 'center' : 'left'}`)}>
            {item.name}
          </span>
          <span style={s(`display:flex;align-items:center;justify-content:${isActive ? 'center' : 'flex-start'};gap:5px;flex-wrap:wrap;margin-top:7px`)}>
            <span style={s(`font:900 ${isActive ? '10.5px' : '8.5px'} 'Nunito';color:${brand};background:${wash};border:1px solid ${line};border-radius:999px;padding:${isActive ? '4px 8px' : '3px 6px'}`)}>
              {item.ownedLabel}
            </span>
            <span style={s(`font:900 ${isActive ? '10.5px' : '8.5px'} 'Nunito';color:${ink};background:#FFF3D1;border-radius:999px;padding:${isActive ? '4px 8px' : '3px 6px'}`)}>
              {item.editionLabel}
            </span>
          </span>
        </span>
        {isActive && (
          <span style={s(`margin-top:auto;height:34px;border-radius:13px;background:${brand};color:#fff;font:900 12px 'Fredoka';display:flex;align-items:center;justify-content:center;gap:4px;box-shadow:0 4px 0 #4B3BA6`)}>
            <span className="mi" style={s("font-size:16px;font-variation-settings:'FILL' 1")}>view_in_ar</span>
            Open
          </span>
        )}
      </span>
    </button>
  );
}

export default function PocketShelf({
  items = [],
  selectedIndex = 0,
  onSelect = noop,
  onOpen = noop,
}) {
  if (items.length === 0) return null;

  const safeSelectedIndex = clampSelectedIndex(selectedIndex, items.length);
  const visibleItems = items
    .map((item, index) => ({ item, index, offset: index - safeSelectedIndex }))
    .filter(({ offset }) => Math.abs(offset) <= 2);
  const activeItem = items[safeSelectedIndex];

  return (
    <section aria-label="Owned Holo Finds shelf" style={s('position:relative;background:linear-gradient(180deg,#FFFFFF 0%,#F9F6FF 100%);border:1.5px solid #EDEAF6;border-radius:24px;padding:14px 0 16px;overflow:hidden;box-shadow:0 8px 0 rgba(106,90,205,.10),0 8px 20px rgba(23,19,38,.08)')}>
      <div style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 15px 4px')}>
        <div style={s('min-width:0')}>
          <div style={s(`font:900 18px/1 'Fredoka';color:${ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>{activeItem.name}</div>
          <div style={s(`margin-top:4px;font:800 11px 'Nunito';color:${muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>{activeItem.family}</div>
        </div>
        <span style={s(`flex:none;display:inline-flex;align-items:center;gap:4px;background:#FFE4F1;color:#C2186A;border-radius:999px;padding:5px 8px;font:900 10px 'Fredoka'`)}>
          <span className="mi" style={s("font-size:13px;font-variation-settings:'FILL' 1")}>auto_awesome</span>
          {safeSelectedIndex + 1}/{items.length}
        </span>
      </div>

      <div style={s('position:relative;height:326px;perspective:760px;overflow:hidden')}>
        <div style={s(`position:absolute;left:24px;right:24px;bottom:17px;height:28px;border-radius:50%;background:rgba(106,90,205,.14);filter:blur(.5px)`)} />
        <div style={s(`position:absolute;left:18px;right:18px;bottom:33px;height:19px;border-radius:999px;background:linear-gradient(90deg,#F7D7FF,#D5F5FF,#FFF0B8);border:1.5px solid ${line};box-shadow:0 7px 0 rgba(106,90,205,.12)`)} />
        {visibleItems.map(({ item, index, offset }) => (
          <PocketShelfCard
            key={item.id}
            item={item}
            index={index}
            offset={offset}
            isActive={index === safeSelectedIndex}
            onSelect={onSelect}
            onOpen={onOpen}
          />
        ))}
      </div>

      <div style={s('display:flex;align-items:center;justify-content:center;gap:6px;padding:2px 12px 0')}>
        {items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            aria-label={`Select ${item.name}`}
            aria-current={index === safeSelectedIndex ? 'true' : undefined}
            onClick={() => onSelect(index)}
            style={s(`width:${index === safeSelectedIndex ? '20px' : '7px'};height:7px;border:0;border-radius:999px;background:${index === safeSelectedIndex ? brand : '#DCD5EF'};padding:0;cursor:pointer;transition:width .2s ease, background .2s ease`)}
          />
        ))}
      </div>
    </section>
  );
}
