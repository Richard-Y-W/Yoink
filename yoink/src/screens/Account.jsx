import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';

const { ink, wash, line, muted, brand } = marketTheme;

export default function Account({
  balance = 0,
  streak = 0,
  ordersInFlight = 0,
  cartCount = 0,
  onOpenCart = () => {},
}) {
  const stats = [
    { label: 'Balance', value: `Ȳ${balance}` },
    { label: 'Streak', value: `${streak}d` },
    { label: 'Orders', value: `${ordersInFlight}` },
  ];

  return (
    <div style={s('min-height:100%;background:#fff;color:#171326;padding-bottom:92px')}>
      <div style={s('position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #EEEAF6;padding:12px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px')}>
        <div>
          <div style={s(`font:800 22px 'Fredoka';color:${ink}`)}>Account</div>
          <div style={s(`font:700 12px 'Nunito';color:${muted}`)}>Wallet, orders, and profile</div>
        </div>
        <button type="button" aria-label="Open cart" onClick={onOpenCart} style={s(`border:0;border-radius:16px;background:${brand};color:#fff;padding:8px 11px;font:800 12px 'Fredoka';display:flex;align-items:center;gap:5px;cursor:pointer`)}>
          <span className="mi" style={s("font-size:16px;font-variation-settings:'FILL' 1")}>shopping_bag</span>
          {cartCount}
        </button>
      </div>
      <div style={s('padding:18px 16px 0;display:grid;gap:10px')}>
        {stats.map((stat) => (
          <div key={stat.label} style={s(`border:1px solid ${line};background:${wash};border-radius:8px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between`)}>
            <span style={s(`font:800 13px 'Fredoka';color:${ink}`)}>{stat.label}</span>
            <span style={s(`font:900 18px 'Fredoka';color:${brand}`)}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
