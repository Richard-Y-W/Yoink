import { s } from '../style.js';
import { APP_SCREENS } from '../appFlow.js';

// Shared bottom nav, styled after the design's market nav. The active tab
// takes the screen's accent color; the center Sell button stays decorative
// like the mock.
export default function YoinkNav({ tab, onSelectTab = () => {}, accent = '#6A5ACD', ordersInFlight = 0, onSell = () => {} }) {
  const idle = '#AFADBA';
  const ink = '#171326';

  const tabs = [
    { id: APP_SCREENS.market, icon: 'home', label: 'Home' },
    { id: APP_SCREENS.quests, icon: 'joystick', label: 'Quests' },
    { id: APP_SCREENS.pocket, icon: 'backpack', label: 'Pocket' },
    { id: APP_SCREENS.orders, icon: 'package_2', label: 'Orders', badge: ordersInFlight },
  ];

  const renderTab = ({ id, icon, label, badge }) => {
    const active = tab === id;
    return (
      <button
        key={id}
        type="button"
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        onClick={() => onSelectTab(id)}
        style={s("flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;background:transparent;padding:0;cursor:pointer")}
      >
        <span style={s("position:relative;display:inline-flex")}>
          <span className="mi" style={s(`font-size:24px;color:${active ? accent : idle};${active ? "font-variation-settings:'FILL' 1" : ''}`)}>{icon}</span>
          {badge > 0 && (
            <span style={s(`position:absolute;top:-4px;right:-8px;min-width:15px;height:15px;padding:0 3px;border-radius:8px;background:${accent};color:#fff;font:700 9px 'Fredoka';display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff`)}>
              {badge}
            </span>
          )}
        </span>
        <span style={s(`font:${active ? '700' : '600'} 10px 'Fredoka';color:${active ? accent : idle}`)}>{label}</span>
      </button>
    );
  };

  return (
    <div style={s("position:sticky;bottom:0;z-index:30;background:#fff;box-shadow:0 -3px 16px rgba(23,19,38,.07);padding:9px 14px 22px;display:flex;align-items:flex-end;justify-content:space-between")}>
      {tabs.slice(0, 2).map(renderTab)}
      <button
        type="button"
        aria-label="Sell"
        onClick={onSell}
        style={s("flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;border:0;background:transparent;padding:0;cursor:pointer")}
      >
        <span style={s(`margin-top:-26px;width:58px;height:58px;border-radius:18px;background:${ink};box-shadow:0 7px 16px rgba(23,19,38,.4),0 0 0 4px #fff;display:flex;align-items:center;justify-content:center`)}>
          <span className="mi" style={s("font-size:30px;color:#fff")}>add</span>
        </span>
        <span style={s(`font:700 10px 'Fredoka';color:${ink};margin-top:-2px`)}>Sell</span>
      </button>
      {tabs.slice(2).map(renderTab)}
    </div>
  );
}
