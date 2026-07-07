import { s } from '../style.js';
import { APP_SCREENS } from '../appFlow.js';

// Shared bottom nav for the Market Copy.
export default function YoinkNav({ tab, onSelectTab = () => {}, accent = '#6A5ACD' }) {
  const idle = '#AFADBA';
  const activeTabBackground = '#F0ECFF';
  const activeTabBorder = 'rgba(106,90,205,.34)';

  const tabs = [
    { id: APP_SCREENS.home, icon: 'home', label: 'Home' },
    { id: APP_SCREENS.search, icon: 'search', label: 'Search' },
    { id: APP_SCREENS.orders, icon: 'local_shipping', label: 'Orders' },
    { id: APP_SCREENS.pocket, icon: 'inventory_2', label: 'Pocket' },
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
        style={s('flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:transparent;padding:2px 0 0;cursor:pointer')}
      >
        <span style={s(`min-width:54px;height:38px;border-radius:18px;background:${active ? activeTabBackground : 'transparent'};border:${active ? `1.5px solid ${activeTabBorder}` : '1.5px solid transparent'};box-shadow:${active ? '0 8px 16px rgba(106,90,205,.28)' : 'none'};display:flex;align-items:center;justify-content:center;transform:${active ? 'translateY(-3px) scale(1.04)' : 'none'};transition:transform .16s ease,background .16s ease,box-shadow .16s ease,border-color .16s ease`)}>
          <span className="mi" style={s(`font-size:24px;color:${active ? accent : idle};${active ? "font-variation-settings:'FILL' 1" : ''}`)}>{icon}</span>
        </span>
        <span style={s(`font:${active ? '800' : '600'} 10px 'Fredoka';color:${active ? accent : idle};transition:color .16s ease,font-weight .16s ease`)}>{label}</span>
      </button>
    );
  };

  return (
    <div style={s("position:sticky;bottom:0;z-index:30;background:#fff;box-shadow:0 -3px 16px rgba(23,19,38,.07);padding:10px 14px 21px;display:flex;align-items:flex-end;justify-content:space-between")}>
      {tabs.map(renderTab)}
    </div>
  );
}
