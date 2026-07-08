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
  currencyButtonBackground,
} = marketTheme;

function ActionTile({ action }) {
  return (
    <button
      type="button"
      onClick={action.onPress}
      style={s(`border:1.5px solid ${line};background:#fff;border-radius:8px;padding:11px 10px;display:flex;align-items:center;gap:9px;text-align:left;cursor:pointer;box-shadow:0 4px 12px rgba(23,19,38,.05);min-height:58px`)}
    >
      <span style={s(`width:33px;height:33px;border-radius:10px;background:${action.bg};display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 ${action.shadow}`)}>
        <span className="mi" style={s(`font-size:18px;color:${action.tint};font-variation-settings:'FILL' 1`)}>{action.icon}</span>
      </span>
      <span style={s("min-width:0;display:flex;flex-direction:column;gap:1px")}>
        <span style={s(`font:800 12.5px 'Fredoka';color:${ink}`)}>{action.label}</span>
        <span style={s(`font:700 10.5px 'Nunito';color:${muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>{action.detail}</span>
      </span>
      <span className="mi" style={s(`margin-left:auto;font-size:17px;color:${muted}`)}>chevron_right</span>
    </button>
  );
}

export default function Account({
  balance = 0,
  streak = 0,
  ordersInFlight = 0,
  cartCount = 0,
  watchedCount = 0,
  onOpenCart = () => {},
  onOpenWatching = () => {},
  onOpenOrders = () => {},
  onToast = () => {},
}) {
  const stageMarkers = [
    { label: 'Packing', icon: 'inventory_2' },
    { label: 'Rolling', icon: 'local_shipping' },
    { label: 'Delivered', icon: 'celebration' },
  ];
  const actionItems = [
    {
      label: 'Orders',
      detail: ordersInFlight ? `${ordersInFlight} moving now` : 'No active drops',
      icon: 'local_shipping',
      bg: '#F0ECFF',
      tint: brand,
      shadow: 'rgba(106,90,205,.18)',
      onPress: onOpenOrders,
    },
    {
      label: 'Watching',
      detail: `${watchedCount} saved find${watchedCount === 1 ? '' : 's'}`,
      icon: 'favorite',
      bg: '#FFE4F1',
      tint: '#FF3D9A',
      shadow: 'rgba(255,61,154,.20)',
      onPress: onOpenWatching,
    },
    {
      label: 'Wallet',
      detail: `Y ${balance.toLocaleString()}`,
      icon: 'account_balance_wallet',
      bg: '#FFF3D1',
      tint: '#C87900',
      shadow: 'rgba(255,184,77,.24)',
      onPress: () => onToast(`Wallet snap: Y ${balance.toLocaleString()} ready.`),
    },
    {
      label: 'Support',
      detail: 'Receipts and help',
      icon: 'support_agent',
      bg: '#B8F5D0',
      tint: '#12865A',
      shadow: 'rgba(18,134,90,.20)',
      onPress: () => onToast('Support desk is getting stocked.'),
    },
    {
      label: 'Settings',
      detail: 'Alerts and profile',
      icon: 'tune',
      bg: wash,
      tint: ink,
      shadow: 'rgba(23,19,38,.10)',
      onPress: () => onToast('Settings will open once profiles are wired.'),
    },
  ];
  const orderMeter = Math.min(100, Math.max(18, ordersInFlight * 34));

  return (
    <div style={s(`min-height:100%;background:${wash};color:${ink};padding-bottom:92px;font-family:'Nunito',sans-serif`)}>
      <div style={s('position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #EEEAF6;padding:12px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px')}>
        <div>
          <div style={s(`font:800 22px 'Fredoka';color:${ink}`)}>Account</div>
          <div style={s(`font:700 12px 'Nunito';color:${muted}`)}>Orders, wallet, and saved finds</div>
        </div>
        <button type="button" aria-label="Open cart" onClick={onOpenCart} style={s(`border:0;border-radius:16px;background:${brand};color:#fff;padding:8px 11px;font:800 12px 'Fredoka';display:flex;align-items:center;gap:5px;cursor:pointer;box-shadow:0 5px 12px rgba(106,90,205,.30)`)}>
          <span className="mi" style={s("font-size:16px;font-variation-settings:'FILL' 1")}>shopping_cart</span>
          {cartCount}
        </button>
      </div>

      <div style={s('padding:14px 14px 0;display:grid;gap:12px')}>
        <section style={s("position:relative;overflow:hidden;border:1.5px solid #DCD5EF;background:#fff;border-radius:8px;padding:14px;box-shadow:0 8px 22px rgba(106,90,205,.10)")}>
          <div style={s("position:absolute;right:-24px;top:-28px;width:118px;height:118px;border-radius:50%;background:#B8F5D0;opacity:.56")} />
          <div style={s("position:absolute;right:34px;bottom:-30px;width:76px;height:76px;border-radius:50%;background:#FFE4F1;opacity:.72")} />
          <div style={s("position:relative;display:flex;align-items:center;gap:12px")}>
            <div style={s(`width:58px;height:58px;border-radius:18px;background:${brand};display:flex;align-items:center;justify-content:center;box-shadow:0 6px 0 #4B3BA6`)}>
              <span style={s("font:900 25px 'Fredoka';color:#fff")}>Y</span>
            </div>
            <div style={s("min-width:0;flex:1")}>
              <div style={s(`font:800 11px 'Nunito';color:${brand};text-transform:uppercase;letter-spacing:.6px`)}>Yoink ID</div>
              <div style={s(`font:900 22px 'Fredoka';color:${ink};line-height:1.05`)}>Market Copy</div>
              <div style={s("display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap")}>
                <span style={s(`display:inline-flex;align-items:center;gap:4px;background:${attentionBadgeBackground};color:${attentionBadgeText};font:800 10.5px 'Fredoka';padding:4px 8px;border-radius:8px`)}>
                  <span className="mi" style={s("font-size:13px;font-variation-settings:'FILL' 1")}>verified</span>
                  Top shopper
                </span>
                <span style={s(`font:800 10.5px 'Fredoka';color:${muted}`)}>Local profile</span>
              </div>
            </div>
          </div>
          <div style={s("position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px")}>
            {[
              { label: 'Streak', value: `${streak}d` },
              { label: 'Watching', value: watchedCount },
              { label: 'Orders', value: ordersInFlight },
            ].map((stat) => (
              <div key={stat.label} style={s(`background:${wash};border:1.5px solid ${line};border-radius:8px;padding:9px 6px;text-align:center`)}>
                <div style={s(`font:900 17px 'Fredoka';color:${brand}`)}>{stat.value}</div>
                <div style={s(`font:800 9.5px 'Nunito';color:${muted}`)}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={s(`border:1.5px solid ${line};background:#fff;border-radius:8px;padding:14px;display:grid;gap:12px`)}>
          <div style={s("display:flex;align-items:center;justify-content:space-between;gap:10px")}>
            <div>
              <div style={s(`font:900 17px 'Fredoka';color:${ink}`)}>Order pulse</div>
              <div style={s(`font:700 11.5px 'Nunito';color:${muted}`)}>{ordersInFlight ? 'Packing and rolling toward you' : 'No live deliveries yet'}</div>
            </div>
            <span style={s(`display:inline-flex;align-items:center;gap:5px;background:#B8F5D0;color:#12865A;font:900 12px 'Fredoka';padding:7px 10px;border-radius:8px`)}>
              <span className="mi" style={s("font-size:16px;font-variation-settings:'FILL' 1")}>local_shipping</span>
              {ordersInFlight}
            </span>
          </div>
          <div style={s("display:grid;gap:8px")}>
            <div style={s("height:10px;border-radius:99px;background:#F0ECFF;overflow:hidden")}>
              <div style={s(`height:100%;width:${orderMeter}%;background:${brand};border-radius:99px;box-shadow:8px 0 0 #FFB84D;transition:width .28s ease`)} />
            </div>
            <div style={s("display:grid;grid-template-columns:repeat(3,1fr);gap:7px")}>
              {stageMarkers.map((stage, index) => {
                const active = ordersInFlight > 0 && orderMeter >= 18 + index * 28;
                return (
                  <div key={stage.label} style={s(`display:flex;align-items:center;justify-content:center;gap:4px;border:1.5px solid ${active ? '#DCD5EF' : line};border-radius:8px;background:${active ? '#F7F3FF' : wash};padding:7px 4px`)}>
                    <span className="mi" style={s(`font-size:14px;color:${active ? brand : muted};font-variation-settings:'FILL' 1`)}>{stage.icon}</span>
                    <span style={s(`font:900 9.5px 'Fredoka';color:${active ? brand : muted};white-space:nowrap`)}>{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:9px")}>
            <button type="button" onClick={onOpenOrders} style={s(`border:1.5px solid ${line};background:${wash};border-radius:8px;padding:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer`)}>
              <span>
                <span style={s(`display:block;font:900 12.5px 'Fredoka';color:${ink}`)}>Open Orders</span>
                <span style={s(`display:block;font:800 10.5px 'Nunito';color:${brand}`)}>{ordersInFlight ? `${ordersInFlight} tracking` : 'Track pickups'}</span>
              </span>
              <span className="mi" style={s(`font-size:20px;color:${brand};font-variation-settings:'FILL' 1`)}>local_shipping</span>
            </button>
            <button type="button" onClick={() => onToast(`Wallet snap: Y ${balance.toLocaleString()} ready.`)} style={s(`border:1.5px solid ${line};background:${wash};border-radius:8px;padding:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer`)}>
              <span>
                <span style={s(`display:block;font:900 12.5px 'Fredoka';color:${ink}`)}>Wallet snap</span>
                <span style={s(`display:block;font:800 10.5px 'Nunito';color:${brand}`)}>Y {balance.toLocaleString()}</span>
              </span>
              <span className="mi" style={s(`font-size:20px;color:${currencyButtonBackground};font-variation-settings:'FILL' 1`)}>paid</span>
            </button>
          </div>
          <div style={s("display:grid;grid-template-columns:1fr;gap:9px")}>
            <button type="button" onClick={onOpenCart} style={s(`border:1.5px solid ${line};background:${wash};border-radius:8px;padding:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer`)}>
              <span>
                <span style={s(`display:block;font:900 12.5px 'Fredoka';color:${ink}`)}>Cart ready</span>
                <span style={s(`display:block;font:800 10.5px 'Nunito';color:${brand}`)}>{cartCount} item{cartCount === 1 ? '' : 's'}</span>
              </span>
              <span className="mi" style={s(`font-size:20px;color:${brand};font-variation-settings:'FILL' 1`)}>shopping_cart</span>
            </button>
          </div>
        </section>

        <section style={s("display:grid;gap:9px")}>
          <div style={s(`font:900 17px 'Fredoka';color:${ink};padding:0 2px`)}>Quick actions</div>
          {actionItems.map((action) => (
            <ActionTile key={action.label} action={action} />
          ))}
        </section>
      </div>
    </div>
  );
}
