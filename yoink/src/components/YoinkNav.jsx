import { s } from '../style.js';
import { APP_SCREENS } from '../appFlow.js';

// Shared bottom nav for the Market Copy.
export default function YoinkNav({ tab, onSelectTab = () => {}, accent = '#6A5ACD' }) {
  const idle = '#AFADBA';

  const tabs = [
    { id: APP_SCREENS.home, icon: 'home', label: 'Home' },
    { id: APP_SCREENS.search, icon: 'search', label: 'Search' },
    { id: APP_SCREENS.watching, icon: 'visibility', label: 'Watching' },
    { id: APP_SCREENS.account, icon: 'person', label: 'Account' },
  ];

  const renderTab = ({ id, icon, label }) => {
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
        </span>
        <span style={s(`font:${active ? '700' : '600'} 10px 'Fredoka';color:${active ? accent : idle}`)}>{label}</span>
      </button>
    );
  };

  return (
    <div style={s("position:sticky;bottom:0;z-index:30;background:#fff;box-shadow:0 -3px 16px rgba(23,19,38,.07);padding:9px 14px 22px;display:flex;align-items:flex-end;justify-content:space-between")}>
      {tabs.map(renderTab)}
    </div>
  );
}
