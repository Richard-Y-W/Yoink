import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, wash, line, muted, brand } = marketTheme;

export default function Watching({ balance = 0, cartCount = 0, onOpenCart = () => {} }) {
  return (
    <div style={s('min-height:100%;background:#fff;color:#171326;padding-bottom:92px')}>
      <div style={s('position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #EEEAF6;padding:12px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px')}>
        <div>
          <div style={s(`font:800 22px 'Fredoka';color:${ink}`)}>Watching</div>
          <div style={s(`font:700 12px 'Nunito';color:${muted}`)}>Saved finds and watched drops</div>
        </div>
        <button type="button" aria-label="Open cart" onClick={onOpenCart} style={s(`border:0;border-radius:16px;background:${brand};color:#fff;padding:8px 11px;font:800 12px 'Fredoka';display:flex;align-items:center;gap:5px;cursor:pointer`)}>
          <span className="mi" style={s("font-size:16px;font-variation-settings:'FILL' 1")}>shopping_bag</span>
          {cartCount}
        </button>
      </div>
      <div style={s('padding:18px 16px 0')}>
        <div style={s(`border:1px solid ${line};background:${wash};border-radius:8px;padding:18px`)}>
          <div style={s(`font:800 16px 'Fredoka';color:${ink}`)}>Nothing watched yet</div>
          <div style={s(`margin-top:6px;font:700 13px 'Nunito';color:${muted};line-height:1.35`)}>Heart items from the market later and they will land here.</div>
          <div style={s(`margin-top:14px;font:800 13px 'Fredoka';color:${brand}`)}>Balance Ȳ{balance}</div>
        </div>
      </div>
    </div>
  );
}
