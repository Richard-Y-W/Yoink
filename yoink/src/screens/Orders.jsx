import { useEffect, useRef, useState } from 'react';
import { s } from '../style.js';
import { fetchOrders } from '../api.js';
import { formatMoney } from '../cart.js';
import { marketTheme } from '../marketTheme.js';
import Mochi from '../components/Mochi.jsx';

const { ink, wash, line, muted, brand, attentionBadgeBackground, attentionBadgeText } = marketTheme;

const STAGES = [
  { id: 'processing', label: 'Processing', icon: 'inventory_2' },
  { id: 'packed', label: 'Packed', icon: 'package_2' },
  { id: 'shipped', label: 'Shipped', icon: 'local_shipping' },
  { id: 'out-for-delivery', label: 'Out for delivery', icon: 'sprint' },
  { id: 'delivered', label: 'Delivered', icon: 'celebration' },
];

function StageTimeline({ stageIndex }) {
  const pct = (stageIndex / (STAGES.length - 1)) * 100;
  return (
    <div style={s("margin-top:13px")}>
      <div style={s("position:relative;height:6px;border-radius:99px;background:#EFEBF9")}>
        <div style={s(`position:absolute;left:0;top:0;height:100%;width:${pct}%;border-radius:99px;background:linear-gradient(90deg,${brand},#B07CFF);transition:width .6s cubic-bezier(.22,1,.36,1)`)} />
        <div style={s(`position:absolute;top:50%;left:${pct}%;transform:translate(-50%,-58%);width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 3px 8px rgba(23,19,38,.18);display:flex;align-items:center;justify-content:center;transition:left .6s cubic-bezier(.22,1,.36,1)`)}>
          <span className="mi" style={s(`font-size:16px;color:${brand};font-variation-settings:'FILL' 1`)}>{STAGES[stageIndex].icon}</span>
        </div>
      </div>
      <div style={s("display:flex;justify-content:space-between;margin-top:9px")}>
        {STAGES.map((stage, index) => (
          <span
            key={stage.id}
            style={s(`flex:1;text-align:${index === 0 ? 'left' : index === STAGES.length - 1 ? 'right' : 'center'};font:${index === stageIndex ? '800' : '600'} 9px 'Nunito';color:${index <= stageIndex ? brand : '#B4B0C2'}`)}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order, celebrate }) {
  const delivered = order.stage === 'delivered';
  return (
    <div style={s(`background:#fff;border:1.5px solid ${celebrate ? brand : '#EDEAF6'};border-radius:18px;padding:14px;box-shadow:0 4px 14px rgba(23,19,38,.06);${celebrate ? 'animation:ypop .5s ease both' : ''}`)}>
      <div style={s("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
        <div style={s("display:flex;align-items:center;gap:8px;min-width:0")}>
          <span style={s(`font:700 14px 'Fredoka';color:${ink}`)}>{order.id}</span>
          {celebrate && (
            <span style={s(`padding:2px 8px;border-radius:7px;background:${attentionBadgeBackground};font:700 10px 'Fredoka';color:${attentionBadgeText}`)}>
              JUST YOINK&#8217;D
            </span>
          )}
        </div>
        <span style={s(`display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:${delivered ? '#DFF8F1' : wash};font:700 11px 'Fredoka';color:${delivered ? '#0B8576' : brand}`)}>
          {!delivered && <span style={s(`width:6px;height:6px;border-radius:50%;background:${brand};animation:ydot 1.4s infinite`)} />}
          {delivered && <span className="mi" style={s("font-size:13px;font-variation-settings:'FILL' 1")}>check_circle</span>}
          {order.stageLabel}
        </span>
      </div>

      <div style={s("display:flex;align-items:center;gap:10px;margin-top:12px")}>
        <div style={s("display:flex")}>
          {order.items.slice(0, 3).map((item, index) => (
            <div key={item.id} style={s(`width:44px;height:44px;border-radius:12px;border:2px solid #fff;background:${item.imageStripe};margin-left:${index === 0 ? '0' : '-12px'};box-shadow:0 2px 6px rgba(23,19,38,.1)`)} />
          ))}
        </div>
        <div style={s("flex:1;min-width:0")}>
          <div style={s(`font:800 12.5px/1.3 'Nunito';color:${ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>
            {order.items[0].title}{order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}
          </div>
          <div style={s(`font:600 11px 'Nunito';color:${muted};margin-top:2px`)}>
            {order.shippingLabel} &middot; {order.addressLabel}
          </div>
        </div>
        <div style={s(`font:700 14px 'Fredoka';color:${ink}`)}>{formatMoney(order.total)}</div>
      </div>

      <StageTimeline stageIndex={order.stageIndex} />

      <div style={s(`margin-top:11px;font:700 11.5px 'Nunito';color:${delivered ? '#0B8576' : muted}`)}>
        {delivered
          ? 'Delivered! Added to your Pocket.'
          : `Next update in ~${order.nextStageIn}s (Yoink express time)`}
      </div>
    </div>
  );
}

export default function Orders({ balance = 0, celebrateOrderId = null, onDeliveryUpdate = () => {} }) {
  const [orders, setOrders] = useState(null);
  const stageIndexByOrderRef = useRef(new Map());

  useEffect(() => {
    let alive = true;
    const load = () => fetchOrders().then((data) => {
      if (!alive || !data.orders) return;
      const nextStages = new Map();
      let advanced = false;

      for (const order of data.orders) {
        const previousStageIndex = stageIndexByOrderRef.current.get(order.id);
        if (typeof previousStageIndex === 'number' && order.stageIndex > previousStageIndex) {
          advanced = true;
        }
        nextStages.set(order.id, order.stageIndex);
      }

      stageIndexByOrderRef.current = nextStages;
      setOrders(data.orders);
      if (advanced) onDeliveryUpdate();
    }).catch(() => {});
    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [onDeliveryUpdate]);

  return (
    <div style={s(`min-height:100%;background:${wash};display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:${ink}`)}>
      <div style={s("position:sticky;top:0;z-index:30;background:#fff;padding:47px 14px 13px;box-shadow:0 3px 14px rgba(23,19,38,.06)")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between")}>
          <div style={s("display:flex;align-items:center;gap:7px")}>
            <div style={s(`font:700 23px 'Fredoka';color:${brand};letter-spacing:.2px`)}>Yoink!</div>
            <div style={s(`font:700 9.5px 'Fredoka';letter-spacing:.6px;color:#fff;background:${brand};padding:3px 7px;border-radius:7px`)}>ORDERS</div>
          </div>
          <div style={s(`display:flex;align-items:center;gap:5px;background:${brand};border-radius:999px;padding:4px 10px 4px 5px`)}>
            <span style={s(`width:16px;height:16px;border-radius:50%;background:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:${brand};flex:none`)}>Y</span>
            <span style={s("font:700 12px 'Fredoka';color:#fff")}>{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style={s("flex:1;padding:14px 14px 98px;display:flex;flex-direction:column;gap:13px")}>
        {orders === null && (
          <div style={s("display:flex;justify-content:center;padding:40px 0")}>
            <div style={s(`width:28px;height:28px;border-radius:50%;border:3px solid ${line};border-top-color:${ink};animation:yspin .8s linear infinite`)} />
          </div>
        )}

        {orders !== null && orders.length === 0 && (
          <div style={s(`padding:34px 18px;border:1.5px dashed #DCD5EF;border-radius:20px;background:#fff;text-align:center`)}>
            <div style={s(`font:700 18px 'Fredoka';color:${ink}`)}>Nothing yoink&#8217;d yet</div>
            <div style={s(`margin-top:6px;font:700 12.5px 'Nunito';color:${muted}`)}>
              Grab something from the market and track it here.
            </div>
            <div style={s("display:flex;justify-content:center;margin-top:16px")}>
              <Mochi color={brand} say="The market has fresh finds!" size={50} />
            </div>
          </div>
        )}

        {orders !== null && orders.map((order) => (
          <OrderCard key={order.id} order={order} celebrate={order.id === celebrateOrderId} />
        ))}
      </div>
    </div>
  );
}
