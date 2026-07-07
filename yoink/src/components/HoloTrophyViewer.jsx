import { useEffect, useRef } from 'react';
import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, wash, line, muted, brand } = marketTheme;

const noop = () => {};

export default function HoloTrophyViewer({ item = null, onClose = noop }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

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

  if (!item) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      tabIndex={-1}
      style={s('position:absolute;inset:0;z-index:960;background:rgba(23,19,38,.24);display:flex;align-items:flex-end;justify-content:center;padding:16px;animation:ypop .18s ease both;outline:none')}
    >
      <div
        role="presentation"
        aria-hidden="true"
        onClick={onClose}
        style={s('position:absolute;inset:0;border:0;background:transparent;cursor:pointer')}
      />
      <div style={s('position:relative;width:100%;border-radius:24px;background:#fff;border:1.5px solid #EDEAF6;padding:14px;box-shadow:0 12px 0 rgba(106,90,205,.16),0 24px 44px rgba(23,19,38,.24)')}>
        <button
          type="button"
          aria-label="Close trophy viewer"
          onClick={onClose}
          style={s(`position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;border-radius:13px;background:${wash};display:flex;align-items:center;justify-content:center;color:${ink};cursor:pointer;z-index:2`)}
        >
          <span className="mi" style={s('font-size:20px')}>close</span>
        </button>

        <div style={s(`height:210px;border-radius:20px;background:${item.imageUrl ? '#fff' : item.imageStripe || item.stripe || wash};border:1.5px solid ${line};display:flex;align-items:center;justify-content:center;overflow:hidden`)}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} style={s('width:100%;height:100%;object-fit:cover;display:block')} />
          ) : (
            <span className="mi" style={s(`font-size:58px;color:${brand};font-variation-settings:'FILL' 1`)}>auto_awesome</span>
          )}
        </div>

        <div style={s('padding:12px 4px 2px;text-align:center')}>
          <div style={s(`font:900 22px/1.05 'Fredoka';color:${ink}`)}>{item.name}</div>
          <div style={s(`margin-top:7px;font:800 12px 'Nunito';color:${muted}`)}>
            {item.ownedLabel} / {item.editionLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
