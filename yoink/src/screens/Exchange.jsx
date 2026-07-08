import { useEffect, useRef, useState } from 'react';
import { s } from '../style.js';
import ItemArt from '../components/ItemArt.jsx';
import CandleChart from '../components/CandleChart.jsx';
import { bellCheckin, buyOnFloor, devClearForcedBell, devForceBellLive, fetchBell, fetchCandles, fetchExchange, sellOnFloor } from '../api.js';
import { artStageBackground } from '../itemArt.js';
import { marketTheme } from '../marketTheme.js';
import { bellLabel, canFloorBuy, canFloorSell, estFloorSale, fmtClock, fmtWait } from '../bellView.js';
import { clampQty, flashDirection } from '../exchangeView.js';

const { ink, wash, line, muted, brand, attentionBadgeBackground, attentionBadgeText } = marketTheme;

const UP = '#E89B2E';
const POLL_MS = 2000;
const LIVE_POLL_MS = 750;
const TF_OPTIONS = ['1m', '5m', '15m', '1h', '4h'];
const PERSONALITY_LABELS = { steady: 'Steady', moody: 'Moody', wild: 'Wild' };

const fmt = (n) => Math.round(n).toLocaleString();

const ROLE_BADGES = {
  confirmed: { label: 'CONF', bg: brand, fg: '#fff' },
  rumor: { label: 'RUMOR', bg: attentionBadgeBackground, fg: attentionBadgeText },
  wildcard: { label: 'WILD', bg: ink, fg: '#FFB84D' },
};

function MiniMarketChart({ points = [], up = true }) {
  if (points.length < 2) {
    return <div style={s("height:82px;background:#0F1820;border-radius:8px")} />;
  }
  const width = 148;
  const height = 82;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const y = (p) => 8 + (height - 16) * (1 - (p - min) / span);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${y(p).toFixed(1)}`);
  const color = up ? '#20D16B' : '#FF4D5E';
  const area = `0,${height} ${coords.join(' ')} ${width},${height}`;
  const lastY = y(points[points.length - 1]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={s("width:100%;height:82px;display:block;background:#0F1820;border-radius:8px")} aria-hidden="true">
      {[18, 40, 62].map((yy) => (
        <line key={yy} x1="0" y1={yy} x2={width} y2={yy} stroke="#24303B" strokeWidth="1" opacity="0.8" />
      ))}
      {[36, 74, 112].map((xx) => (
        <line key={xx} x1={xx} y1="0" x2={xx} y2={height} stroke="#1B2630" strokeWidth="1" />
      ))}
      <polygon points={area} fill={color} opacity="0.14" />
      <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="0" y1={lastY} x2={width} y2={lastY} stroke="#FFB84D" strokeWidth="1" strokeDasharray="3 3" opacity="0.75" />
      <circle cx={width - 2} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

function StreakChip({ streak, dark = false }) {
  if (!streak) return null;
  const exchanges = streak.bellsRung ?? 0;
  return (
    <span style={s(`display:inline-flex;align-items:center;gap:4px;background:${dark ? 'rgba(255,255,255,.12)' : wash};border-radius:999px;padding:3px 9px;font:800 10px 'Nunito';color:${dark ? '#FFB84D' : ink}`)}>
      <span className="mi" style={s(`font-size:13px;color:${dark ? '#FFB84D' : UP};font-variation-settings:'FILL' 1`)}>notifications_active</span>
      {exchanges} bell{exchanges === 1 ? '' : 's'} rung · {streak.days}d streak{streak.freezes > 0 ? ' · freeze' : ''}
    </span>
  );
}

// The Bell card: the live floor when a session is running, otherwise the
// next-bell countdown with the confirmed lineup and the rumor.
function BellCard({ bell, tickerById, busy, balance, flashes, onBuy, onSell, onOpenTicker, onToast }) {
  if (!bell) return null;
  const live = bell.live;

  if (live) {
    // The tape is causal: fills only show once their timestamp passes, and
    // the same fill is what pushed the price — feed line and chart agree.
    const fired = (live.events ?? []).filter((fill) => fill.atMs <= bell.now);
    const event = fired.length > 0 ? fired[fired.length - 1] : null;
    const canPlay = Boolean(live.attended || live.eligibility?.ok);
    const minutesLeft = live.closesInMs / 60000;
    const phase = live.closesInMs > 20 * 60000 ? 'OPENING CROSS' : minutesLeft <= 5 ? 'CLOSING CROSS' : 'LIVE TAPE';
    return (
      <div style={s("background:#101822;border-radius:18px;padding:10px;color:#fff;display:flex;flex-direction:column;gap:9px;box-shadow:0 10px 22px rgba(16,24,34,.24);overflow:hidden")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
          <div>
            <span style={s("display:inline-flex;align-items:center;gap:6px;font:800 9px 'Nunito';letter-spacing:.12em;color:#20D16B")}>
              <span style={s("width:7px;height:7px;border-radius:50%;background:#20D16B;animation:ydot .65s infinite")} />
              {phase}
            </span>
            <div style={s("font:700 17px 'Fredoka';color:#fff;margin-top:1px")}>Bell Exchange</div>
          </div>
          <div style={s("text-align:right")}>
            <div style={s("font:800 9px 'Nunito';letter-spacing:.1em;color:#7E8C9A")}>CLOSE</div>
            <div style={s("font:700 16px 'Fredoka';color:#FFB84D")}>{fmtClock(live.closesInMs)}</div>
          </div>
        </div>
        <div style={s("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
          <StreakChip streak={bell.streak} dark />
          <span style={s(`font:800 10.5px 'Nunito';color:${live.banked > 0 ? '#FFB84D' : '#B7ABF0'}`)}>
            {live.banked > 0 ? `Banked this bell: Ȳ${fmt(live.banked)}` : `${live.buysLeft} buy${live.buysLeft === 1 ? '' : 's'} · ${live.sellsLeft} sell${live.sellsLeft === 1 ? '' : 's'} left`}
          </span>
        </div>
        {live.eligibility && !live.eligibility.ok && (
          <div style={s("background:#0F1820;border:1px solid #334353;border-radius:9px;padding:7px 9px;font:800 10px 'Nunito';color:#B7ABF0;text-align:center")}>
            Bring {live.eligibility.required} bell items to join · you have {live.eligibility.owned}
          </div>
        )}

        <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:7px")}>
        {live.lineup.map((row) => {
          const badge = ROLE_BADGES[row.role] ?? ROLE_BADGES.confirmed;
          const up = row.multPct >= 0;
          const ticker = tickerById.get(row.tickerId);
          // Exit the cheapest lot first — biggest realized win per sell.
          const lot = [...row.holdings].sort((a, b) => a.unitPrice - b.unitPrice)[0] ?? null;
          const maxQty = lot ? Math.min(lot.quantity, live.sellsLeft) : 0;
          const sellOne = estFloorSale(row.price, 1);
          const sellMax = estFloorSale(row.price, Math.max(1, maxQty));
          const sellVerdict = canFloorSell(1, { own: row.own, sellsLeft: live.sellsLeft });
          const buyVerdict = canFloorBuy(1, { balance, ask: row.ask, buysLeft: live.buysLeft });
          const avgBasis = row.own > 0
            ? row.holdings.reduce((sum, holding) => sum + holding.unitPrice * holding.quantity, 0) / row.own
            : 0;
          const liveGain = row.own > 0 ? Math.round((row.price * 0.95 - avgBasis) * row.own) : 0;
          return (
            <div key={row.tickerId} style={s("background:#131F2A;border:1px solid #24303B;border-radius:10px;overflow:hidden;min-width:0")}>
              <button
                type="button"
                onClick={() => onOpenTicker(row.tickerId)}
                aria-label={`Open ${row.tickerId} chart`}
                style={s("display:flex;flex-direction:column;gap:5px;width:100%;border:0;background:transparent;color:#fff;padding:7px;cursor:pointer;text-align:left")}
              >
                <div style={s("display:flex;align-items:center;justify-content:space-between;gap:5px")}>
                  <span style={s("display:flex;align-items:center;gap:5px;min-width:0")}>
                    <span style={s("font:700 11px 'Fredoka';color:#fff;white-space:nowrap")}>${row.tickerId}</span>
                    <span style={s(`background:${badge.bg};color:${badge.fg};font:800 6.5px 'Nunito';letter-spacing:.07em;padding:2px 4px;border-radius:4px`)}>{badge.label}</span>
                  </span>
                  <span style={s(`font:800 9px 'Nunito';color:${up ? '#20D16B' : '#FF4D5E'}`)}>{up ? '▲' : '▼'} {Math.abs(row.multPct)}%</span>
                </div>
                <MiniMarketChart points={ticker?.spark ?? []} up={up} />
                <div style={s("display:flex;align-items:center;justify-content:space-between;gap:5px")}>
                  <span style={s(`font:700 14px 'Fredoka';color:#fff;border-radius:6px;padding:1px 4px;margin-left:-4px;${flashes[row.tickerId] ? `animation:${flashes[row.tickerId] === 'up' ? 'yflashup' : 'yflashdn'} .65s ease both` : ''}`)}>Ȳ{fmt(row.price)}</span>
                  <span style={s(`font:800 8px 'Nunito';color:${row.own > 0 ? '#FFB84D' : '#7E8C9A'}`)}>
                    {row.own > 0 ? `OWN ${row.own}` : 'WATCH'}
                  </span>
                </div>
              </button>
              <div style={s("border-top:1px solid #24303B;padding:6px 7px;display:flex;flex-direction:column;gap:5px")}>
                <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:5px")}>
                  <button
                    type="button"
                    disabled={busy || !canPlay || !buyVerdict.ok}
                    onClick={() => onBuy(row.tickerId, 1)}
                    style={s(`border:0;border-radius:8px;background:#20D16B;color:#07170D;font:800 9.5px 'Fredoka';padding:8px 3px;cursor:pointer;opacity:${busy || !canPlay || !buyVerdict.ok ? 0.45 : 1}`)}
                  >
                    Buy 1 · Ȳ{fmt(row.ask)}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !canPlay || !sellVerdict.ok}
                    onClick={() => lot && onSell(lot, 1)}
                    style={s(`border:0;border-radius:8px;background:${sellVerdict.ok ? '#FFB84D' : '#1B2630'};color:${sellVerdict.ok ? '#171326' : '#7E8C9A'};font:800 9.5px 'Fredoka';padding:8px 3px;cursor:pointer;opacity:${busy || !canPlay || !sellVerdict.ok ? 0.45 : 1}`)}
                  >
                    Sell 1 · +Ȳ{fmt(sellOne.net)}
                  </button>
                </div>
                {row.own > 0 ? (
                  <div style={s("display:flex;align-items:center;justify-content:space-between;gap:5px")}>
                    <span style={s("font:800 8px 'Nunito';color:#9AA7B3;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>
                      avg Ȳ{fmt(avgBasis)} · <b style={s(`color:${liveGain >= 0 ? '#20D16B' : '#FF4D5E'}`)}>{liveGain >= 0 ? '+' : '-'}Ȳ{fmt(Math.abs(liveGain))}</b>
                    </span>
                    <button
                      type="button"
                      disabled={busy || maxQty < 1}
                      onClick={() => lot && onSell(lot, maxQty)}
                      style={s(`border:1px solid #FFB84D;border-radius:6px;background:transparent;color:#FFB84D;font:800 8px 'Fredoka';padding:3px 6px;cursor:pointer;white-space:nowrap;opacity:${busy || maxQty < 1 ? 0.45 : 1}`)}
                    >
                      Dump {Math.max(1, maxQty)} · +Ȳ{fmt(sellMax.net)}
                    </button>
                  </div>
                ) : (
                  <div style={s("display:flex;align-items:center;justify-content:center;font:800 8px 'Nunito';letter-spacing:.05em;color:#7E8C9A;text-align:center")}>
                    SHOP MSRP Ȳ{fmt(row.base)} · DELIVERS IN ~4 MIN
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>

        {event && (
          <div style={s("background:#0F1820;border:1px solid #24303B;border-radius:9px;padding:7px 9px;font:700 10px 'Nunito';color:#9AA7B3;text-align:center")}>
            <span style={s("color:#FFB84D")}>{event.trader}</span>{' '}
            <span style={s(`color:${event.side === 'buy' ? '#20D16B' : '#FF4D5E'}`)}>{event.side === 'buy' ? 'bought' : 'dumped'}</span>{' '}
            {event.qty} ${event.tickerId} — watch the tape
          </div>
        )}
      </div>
    );
  }

  const next = bell.next;
  const report = bell.lastReport;
  return (
    <>
      <div style={s("background:#fff;border:1px solid #EDEAF6;border-radius:18px;padding:12px;display:flex;flex-direction:column;gap:9px;box-shadow:0 2px 8px rgba(23,19,38,.05)")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
          <div>
            <div style={s(`font:800 9px 'Nunito';letter-spacing:.12em;color:${muted}`)}>NEXT BELL</div>
            <div style={s(`display:flex;align-items:baseline;gap:7px;margin-top:2px`)}>
              <span style={s(`font:700 20px 'Fredoka';color:${ink}`)}>{bellLabel(next.startsAt)}</span>
              <span style={s(`font:800 11px 'Nunito';color:${UP}`)}>in {fmtWait(next.opensInMs)}</span>
            </div>
          </div>
          <div style={s("display:flex;flex-direction:column;align-items:flex-end;gap:5px")}>
            <StreakChip streak={bell.streak} />
            <button
              type="button"
              onClick={() => onToast('We’ll ring you 30 minutes before the bell!')}
              style={s(`border:1.5px solid ${brand};border-radius:9px;background:#fff;color:${brand};font:700 10px 'Fredoka';padding:5px 9px;cursor:pointer`)}
            >
              Set bell alerts
            </button>
          </div>
        </div>
        {next.confirmed.map((row) => (
          <button
            key={row.tickerId}
            type="button"
            onClick={() => onOpenTicker(row.tickerId)}
            style={s(`display:flex;align-items:center;gap:9px;border:1.5px solid ${line};border-radius:12px;background:#fff;padding:6px 9px;cursor:pointer;text-align:left`)}
          >
            <div style={s(`width:32px;height:32px;flex:none;border-radius:9px;overflow:hidden;background:${artStageBackground('spin', row.artKind)};display:flex;align-items:center;justify-content:center`)}>
              <ItemArt kind={row.artKind} artStyle="spin" width={28} />
            </div>
            <div style={s("flex:1;min-width:0")}>
              <span style={s(`font:700 11.5px 'Fredoka';color:${ink}`)}>${row.tickerId}</span>
              <span style={s(`font:700 10px 'Nunito';color:${muted}`)}> · street Ȳ{fmt(row.price)}{row.own > 0 ? ` · you own ${row.own}` : ''}</span>
            </div>
            <span style={s(`background:${brand};color:#fff;font:800 7.5px 'Nunito';letter-spacing:.07em;padding:2px 6px;border-radius:5px`)}>CONFIRMED</span>
          </button>
        ))}
        <div style={s(`display:flex;align-items:center;gap:8px;border:1.5px dashed ${line};border-radius:12px;padding:7px 10px`)}>
          <span className="mi" style={s(`font-size:16px;color:${UP}`)}>visibility</span>
          <span style={s(`flex:1;font:700 10.5px 'Nunito';color:${muted}`)}>Mochi heard a rumor: something from the <b style={s(`color:${ink}`)}>{next.rumorAisle}</b>… plus 2 wildcards at the open</span>
        </div>
      </div>

      {report && (
        <div style={s("background:#fff;border:1px solid #EDEAF6;border-radius:18px;padding:12px;display:flex;flex-direction:column;gap:7px;box-shadow:0 2px 8px rgba(23,19,38,.05)")}>
          <div style={s(`font:800 9px 'Nunito';letter-spacing:.12em;color:${muted}`)}>LAST BELL · FLOOR REPORT</div>
          {report.entries.map((entry) => (
            <div key={entry.label} style={s("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
              <span style={s(`font:700 11px 'Nunito';color:${muted}`)}>{entry.label}</span>
              <span style={s(`font:700 11px 'Nunito';color:${ink}`)}>
                {entry.trader === 'you' ? <b style={s(`color:${brand}`)}>you</b> : entry.trader} · ${entry.tickerId} <b style={s(`color:${entry.pct >= 0 ? UP : muted}`)}>{entry.pct >= 0 ? '+' : ''}{entry.pct}%</b>
              </span>
            </div>
          ))}
          <div style={s(`border-top:1px dashed ${line};padding-top:7px;font:800 10.5px 'Nunito';color:${report.playerBanked > 0 ? UP : muted};text-align:center`)}>
            {report.playerBanked > 0
              ? `You banked Ȳ${fmt(report.playerBanked)} that bell`
              : `Next bell ${bellLabel(next.startsAt)} — keep something ready`}
          </div>
        </div>
      )}
    </>
  );
}

export default function Exchange({ balance = 0, onWallet = () => {}, onToast = () => {}, onBack = () => {} }) {
  const [data, setData] = useState(null);
  const [bell, setBell] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [tf, setTf] = useState('5m');
  const [side, setSide] = useState('buy');
  const [qty, setQty] = useState(1);
  const [candles, setCandles] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flashes, setFlashes] = useState({});
  const checkedInKey = useRef(null);
  const prevPrices = useRef({});
  const flashTimer = useRef(null);
  // Poll responses can arrive out of order; a fetch that left before a
  // trade must never overwrite the post-trade wallet. Stamp every request
  // and drop any response older than the last one applied.
  const requestSeq = useRef(0);
  const appliedSeq = useRef(0);
  const candleToken = useRef('');
  const isLive = Boolean(bell?.live);

  const refresh = () => {
    const seq = ++requestSeq.current;
    return fetchExchange().then((next) => {
      if (seq <= appliedSeq.current) return;
      appliedSeq.current = seq;
      if (!Array.isArray(next?.tickers)) return;
      const nextFlashes = {};
      for (const ticker of next.tickers) {
        const direction = flashDirection(prevPrices.current[ticker.id], ticker.price);
        if (direction) nextFlashes[ticker.id] = direction;
        prevPrices.current[ticker.id] = ticker.price;
      }
      setData(next);
      if (next.wallet) onWallet(next.wallet);
      if (Object.keys(nextFlashes).length > 0) {
        setFlashes(nextFlashes);
        window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlashes({}), 650);
      }
    }).catch(() => {});
  };

  const refreshBell = () => fetchBell().then((next) => {
    if (next && (next.live !== undefined || next.next)) setBell(next);
  }).catch(() => {});

  useEffect(() => {
    refresh();
    refreshBell();
    const poll = window.setInterval(() => {
      refresh();
      refreshBell();
    }, bell?.live ? LIVE_POLL_MS : POLL_MS);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(flashTimer.current);
    };
  }, [bell?.live?.key]);

  // Attendance: opening the floor during a live session rings the bell
  // once per session and feeds the Duolingo-style streak. If the player
  // isn't eligible yet (not enough lineup items), hold off — a delivery
  // mid-session flips eligibility.ok and this retries.
  useEffect(() => {
    const key = bell?.live?.key;
    if (!key || bell.live.attended || checkedInKey.current === key) return;
    if (bell.live.eligibility && !bell.live.eligibility.ok) return;
    checkedInKey.current = key;
    bellCheckin().then((result) => {
      if (result?.ok && result.first) {
        onToast(`Bell rung! ${result.streak.days}-day streak · ${result.streak.bellsRung} bells total`);
      }
    }).catch(() => {});
  }, [bell?.live?.key, bell?.live?.attended, bell?.live?.eligibility?.ok]);

  // Closing ceremony: when the session the player was watching ends,
  // celebrate the exit — banked chips become real, the report is in.
  const lastLiveRef = useRef(null);
  useEffect(() => {
    if (bell?.live) {
      lastLiveRef.current = { key: bell.live.key, banked: bell.live.banked };
      return;
    }
    if (!bell || !lastLiveRef.current) return;
    const { banked } = lastLiveRef.current;
    lastLiveRef.current = null;
    onToast(banked > 0
      ? `Bell closed — Ȳ${fmt(banked)} banked this session`
      : 'Bell closed — the Floor Report is in');
  }, [bell?.live?.key, bell?.live?.banked, bell]);

  const handleFloorSell = async (holding, qty) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await sellOnFloor(holding.id, qty);
      if (!result.ok) {
        onToast(result.error ?? 'The floor refused the sale');
        return;
      }
      appliedSeq.current = requestSeq.current;
      if (result.wallet) onWallet(result.wallet);
      onToast(result.realized > 0
        ? `Sold ${result.qty} $${result.tickerId} at Ȳ${fmt(result.unit)} · +Ȳ${fmt(result.realized)} profit banked`
        : `Sold ${result.qty} $${result.tickerId} at Ȳ${fmt(result.unit)} · +Ȳ${fmt(result.net)} banked`);
      refreshBell();
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleFloorBuy = async (tickerId, qty) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await buyOnFloor(tickerId, qty);
      if (!result.ok) {
        onToast(result.error ?? 'The floor refused the buy');
        return;
      }
      appliedSeq.current = requestSeq.current;
      if (result.wallet) onWallet(result.wallet);
      onToast(`Filled ${result.qty} $${result.tickerId} at Ȳ${fmt(result.unit)} — it's in your Pocket`);
      refreshBell();
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDevBell = async (force) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = force ? await devForceBellLive() : await devClearForcedBell();
      if (!result.ok) {
        onToast(result.error ?? 'Dev bell command failed');
        return;
      }
      if (result.bell) setBell(result.bell);
      onToast(force ? 'Dev bell opened with seeded items' : 'Dev bell clock cleared');
      refreshBell();
      refresh();
    } finally {
      setBusy(false);
    }
  };

  // Candle feed for the open detail page; token guards tf/ticker switches.
  useEffect(() => {
    if (!detailId) return undefined;
    const token = `${detailId}|${tf}`;
    candleToken.current = token;
    setCandles(null);
    const load = () => fetchCandles(detailId, tf, 48).then((next) => {
      if (candleToken.current !== token) return;
      if (Array.isArray(next?.candles)) setCandles(next.candles);
    }).catch(() => {});
    load();
    const poll = window.setInterval(load, isLive ? LIVE_POLL_MS : POLL_MS);
    return () => window.clearInterval(poll);
  }, [detailId, tf, isLive]);

  const tickers = data?.tickers ?? [];
  const tickerById = new Map(tickers.map((ticker) => [ticker.id, ticker]));
  const detail = detailId ? tickers.find((ticker) => ticker.id === detailId) : null;
  const liveIds = new Set((bell?.live?.lineup ?? []).map((row) => row.tickerId));
  const liveRow = detailId ? bell?.live?.lineup?.find((row) => row.tickerId === detailId) ?? null : null;
  const liveLot = liveRow ? [...liveRow.holdings].sort((a, b) => a.unitPrice - b.unitPrice)[0] ?? null : null;

  const windowHigh = candles ? Math.max(...candles.map((c) => c.h)) : null;
  const windowLow = candles ? Math.min(...candles.map((c) => c.l)) : null;
  const windowVolume = candles ? candles.reduce((sum, c) => sum + c.v, 0) : null;

  return (
    <div style={s(`min-height:100%;background:${wash};display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:${ink}`)}>

      {/* ── header ── */}
      <div style={s("position:sticky;top:0;z-index:30;background:#fff;padding:47px 13px 12px;box-shadow:0 3px 14px rgba(23,19,38,.06)")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between")}>
          <div style={s("display:flex;align-items:center;gap:9px")}>
            <button type="button" aria-label={detail ? 'Back to market' : 'Back'} onClick={() => (detail ? setDetailId(null) : onBack())} style={s(`width:34px;height:34px;border:0;border-radius:11px;background:${wash};display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0`)}>
              <span className="mi" style={s(`font-size:20px;color:${ink}`)}>arrow_back</span>
            </button>
            <div>
              <div style={s(`display:flex;align-items:center;gap:6px;font:700 20px 'Fredoka';color:${brand}`)}>
                {detail ? `$${detail.id}` : 'The Bell'}
                <span style={s(`width:7px;height:7px;border-radius:50%;background:${UP};animation:ydot 1.4s infinite`)} />
              </div>
              <div style={s(`font:700 10.5px 'Nunito';color:${muted}`)}>
                {detail
                  ? detail.name
                  : isLive
                    ? 'Floor open · trade the lineup live'
                    : bell?.next
                      ? `Next floor ${bellLabel(bell.next.startsAt)}`
                      : 'Timed floor sessions'}
              </div>
            </div>
          </div>
          <div style={s(`display:flex;align-items:center;gap:5px;background:${brand};border-radius:999px;padding:4px 10px 4px 5px`)}>
            <span style={s(`width:16px;height:16px;border-radius:50%;background:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:${brand};flex:none`)}>Y</span>
            <span style={s("font:700 12px 'Fredoka';color:#fff")}>{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── content ── */}
      <div style={s("flex:1;padding:13px 13px 108px;display:flex;flex-direction:column;gap:10px")}>

        {detail ? (
          <>
            {/* ── ticker detail ── */}
            <div style={s("display:flex;align-items:center;justify-content:space-between;gap:10px")}>
              <div>
                <div style={s(`display:flex;align-items:center;gap:7px`)}>
                  <span style={s(`font:700 27px 'Fredoka';color:${ink};padding:1px 6px;margin-left:-6px;border-radius:9px;${flashes[detail.id] ? `animation:${flashes[detail.id] === 'up' ? 'yflashup' : 'yflashdn'} .65s ease both` : ''}`)}>
                    Ȳ{fmt(detail.price)}
                  </span>
                  {liveIds.has(detail.id) && <span style={s(`background:${attentionBadgeBackground};color:${attentionBadgeText};font:800 8.5px 'Nunito';letter-spacing:.06em;padding:2px 7px;border-radius:6px;animation:ypulse 1.6s infinite`)}>● LIVE</span>}
                  {detail.hot && <span style={s(`background:${attentionBadgeBackground};color:${attentionBadgeText};font:800 8.5px 'Nunito';letter-spacing:.06em;padding:2px 7px;border-radius:6px`)}>HOT</span>}
                  {detail.dip && <span style={s(`background:#fff;color:${muted};font:800 8.5px 'Nunito';letter-spacing:.06em;padding:2px 7px;border-radius:6px;border:1px solid ${line}`)}>DIP</span>}
                </div>
                <div style={s("display:flex;align-items:center;gap:7px;margin-top:1px")}>
                  <span style={s(`font:800 12px 'Nunito';color:${detail.changePct >= 0 ? UP : muted}`)}>
                    {detail.changePct >= 0 ? '▲' : '▼'} {Math.abs(detail.changePct).toFixed(1)}% today
                  </span>
                  <span style={s(`font:800 9px 'Nunito';letter-spacing:.08em;color:${brand};background:#EDE9FB;padding:2px 7px;border-radius:6px;text-transform:uppercase`)}>
                    {PERSONALITY_LABELS[detail.personality] ?? detail.personality}
                  </span>
                </div>
              </div>
              <div style={s(`width:58px;height:58px;flex:none;border-radius:15px;overflow:hidden;background:${artStageBackground('spin', detail.artKind)};display:flex;align-items:center;justify-content:center`)}>
                <ItemArt kind={detail.artKind} artStyle="spin" width={50} />
              </div>
            </div>

            {/* timeframes */}
            <div style={s("display:flex;gap:6px")}>
              {TF_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={tf === option}
                  onClick={() => setTf(option)}
                  style={s(`flex:1;border:1.5px solid ${tf === option ? brand : line};border-radius:9px;background:${tf === option ? brand : '#fff'};color:${tf === option ? '#fff' : muted};font:700 11px 'Fredoka';padding:6px 0;cursor:pointer;text-transform:uppercase`)}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* candles */}
            <div style={s("background:#fff;border:1px solid #EDEAF6;border-radius:18px;padding:12px 8px 8px;box-shadow:0 2px 8px rgba(23,19,38,.05)")}>
              {candles ? (
                <CandleChart candles={candles} />
              ) : (
                <div style={s(`height:224px;display:flex;align-items:center;justify-content:center;font:700 12px 'Nunito';color:${muted}`)}>Loading candles…</div>
              )}
            </div>

            {/* stats */}
            <div style={s("display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:7px")}>
              {[
                ['High', windowHigh === null ? '—' : `Ȳ${fmt(windowHigh)}`],
                ['Low', windowLow === null ? '—' : `Ȳ${fmt(windowLow)}`],
                ['Retail', `Ȳ${fmt(detail.base)}`],
                ['Vol', windowVolume === null ? '—' : fmt(windowVolume)],
              ].map(([label, value]) => (
                <div key={label} style={s("background:#fff;border:1px solid #EDEAF6;border-radius:12px;padding:7px 8px;text-align:center")}>
                  <div style={s(`font:800 8.5px 'Nunito';letter-spacing:.08em;color:${muted};text-transform:uppercase`)}>{label}</div>
                  <div style={s(`font:700 12px 'Fredoka';color:${ink};margin-top:1px`)}>{value}</div>
                </div>
              ))}
            </div>

            {/* floor ticket — the real exchange: buy and sell items at the live tape */}
            {liveRow ? (
              <div style={s("background:#fff;border:1px solid #EDEAF6;border-radius:18px;padding:11px;display:flex;flex-direction:column;gap:9px;box-shadow:0 2px 8px rgba(23,19,38,.05)")}>
                <div style={s("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
                  <div>
                    <div style={s(`font:800 9px 'Nunito';letter-spacing:.12em;color:${muted}`)}>FLOOR TICKET · LIVE</div>
                    <div style={s(`font:700 12px 'Fredoka';color:${ink};margin-top:1px`)}>
                      {liveRow.own > 0
                        ? `Own ${liveRow.own} · avg Ȳ${fmt(liveRow.holdings.reduce((sum, holding) => sum + holding.unitPrice * holding.quantity, 0) / liveRow.own)}`
                        : 'No position yet'}
                    </div>
                  </div>
                  <span style={s(`font:800 10px 'Nunito';color:${brand};background:${wash};border-radius:999px;padding:4px 8px`)}>
                    {bell.live.buysLeft} buys · {bell.live.sellsLeft} sells left
                  </span>
                </div>
                <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:7px")}>
                  {['buy', 'sell'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={side === option}
                      onClick={() => { setSide(option); setQty(1); }}
                      style={s(`border:1.5px solid ${side === option ? (option === 'buy' ? UP : brand) : line};border-radius:10px;background:${side === option ? (option === 'buy' ? UP : brand) : '#fff'};color:${side === option ? '#fff' : ink};font:700 13px 'Fredoka';padding:9px 0;cursor:pointer`)}
                    >
                      {option === 'buy' ? `Buy · Ȳ${fmt(liveRow.ask)}` : `Sell · Ȳ${fmt(estFloorSale(liveRow.price, 1).net)}`}
                    </button>
                  ))}
                </div>
                <div style={s("display:grid;grid-template-columns:34px 1fr 34px;gap:7px;align-items:center")}>
                  <button type="button" aria-label="Decrease quantity" onClick={() => setQty((current) => clampQty(current - 1))} style={s(`height:34px;border:1.5px solid ${line};border-radius:10px;background:#fff;cursor:pointer`)}>
                    <span className="mi" style={s(`font-size:18px;color:${ink}`)}>remove</span>
                  </button>
                  <input
                    aria-label="Trade quantity"
                    inputMode="numeric"
                    value={qty}
                    onChange={(event) => setQty(clampQty(event.target.value))}
                    style={s(`height:34px;border:1.5px solid ${line};border-radius:10px;text-align:center;font:800 16px 'Fredoka';color:${ink};background:#fff`)}
                  />
                  <button type="button" aria-label="Increase quantity" onClick={() => setQty((current) => clampQty(current + 1))} style={s(`height:34px;border:1.5px solid ${line};border-radius:10px;background:#fff;cursor:pointer`)}>
                    <span className="mi" style={s(`font-size:18px;color:${ink}`)}>add</span>
                  </button>
                </div>
                {(() => {
                  const maxQty = side === 'buy'
                    ? Math.min(bell.live.buysLeft, Math.floor(balance / (liveRow.ask || 1)))
                    : Math.min(liveLot?.quantity ?? 0, bell.live.sellsLeft);
                  const verdict = side === 'buy'
                    ? canFloorBuy(qty, { balance, ask: liveRow.ask, buysLeft: bell.live.buysLeft })
                    : canFloorSell(qty, { own: liveLot?.quantity ?? 0, sellsLeft: bell.live.sellsLeft });
                  const est = side === 'buy' ? liveRow.ask * qty : estFloorSale(liveRow.price, qty).net;
                  return (
                    <>
                      <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:6px")}>
                        {[1, 2, 3].map((preset) => (
                          <button key={preset} type="button" onClick={() => setQty(clampQty(preset))} style={s(`border:1.5px solid ${qty === preset ? brand : line};border-radius:9px;background:#fff;color:${qty === preset ? brand : muted};font:800 10px 'Nunito';padding:6px 0;cursor:pointer`)}>
                            {preset}
                          </button>
                        ))}
                        <button type="button" onClick={() => setQty(clampQty(Math.max(1, maxQty)))} style={s(`border:1.5px solid ${line};border-radius:9px;background:#fff;color:${muted};font:800 10px 'Nunito';padding:6px 0;cursor:pointer`)}>
                          MAX {Math.max(0, maxQty)}
                        </button>
                      </div>
                      {!verdict.ok && <div style={s(`font:800 10.5px 'Nunito';color:${muted};text-align:center`)}>{verdict.reason}</div>}
                      <button
                        type="button"
                        disabled={busy || !verdict.ok}
                        onClick={() => (side === 'buy'
                          ? handleFloorBuy(detail.id, qty)
                          : liveLot && handleFloorSell(liveLot, qty))}
                        style={s(`border:0;border-radius:13px;background:${side === 'buy' ? UP : brand};color:#fff;font:700 13px 'Fredoka';padding:12px 0;cursor:pointer;opacity:${busy || !verdict.ok ? 0.5 : 1};box-shadow:0 4px 10px rgba(23,19,38,.15)`)}
                      >
                        {side === 'buy' ? `Buy ${qty} $${detail.id} · Ȳ${fmt(liveRow.ask * qty)}` : `Sell ${qty} $${detail.id} · +Ȳ${fmt(est)}`}
                      </button>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div style={s("background:#fff;border:1px solid #EDEAF6;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:6px;box-shadow:0 2px 8px rgba(23,19,38,.05);text-align:center")}>
                <div style={s(`font:800 9px 'Nunito';letter-spacing:.12em;color:${muted}`)}>FLOOR CLOSED</div>
                <div style={s(`font:700 13px 'Fredoka';color:${ink}`)}>
                  ${detail.id} trades when its bell rings
                </div>
                <div style={s(`font:700 10.5px 'Nunito';color:${muted}`)}>
                  {bell?.next ? `Next bell ${bellLabel(bell.next.startsAt)} — stock up in the shop first` : 'Stock up in the shop first'}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onBack}
              style={s(`border:0;border-radius:13px;background:${isLive ? ink : brand};color:#fff;font:700 13px 'Fredoka';padding:12px 0;cursor:pointer;box-shadow:0 4px 10px rgba(23,19,38,.15)`)}
            >
              {isLive ? 'Back to the floor' : 'Shop before the bell'}
            </button>
          </>
        ) : (
          <>
            {import.meta.env.DEV && (
              <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:7px")}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDevBell(true)}
                  style={s(`border:0;border-radius:12px;background:${UP};color:#171326;font:700 12px 'Fredoka';padding:10px 0;cursor:pointer;opacity:${busy ? 0.55 : 1}`)}
                >
                  Open bell now
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDevBell(false)}
                  style={s(`border:1.5px solid ${line};border-radius:12px;background:#fff;color:${muted};font:700 12px 'Fredoka';padding:8.5px 0;cursor:pointer;opacity:${busy ? 0.55 : 1}`)}
                >
                  Clear dev bell
                </button>
              </div>
            )}

            {/* ── the bell ── */}
            <BellCard
              bell={bell}
              tickerById={tickerById}
              busy={busy}
              balance={balance}
              flashes={flashes}
              onBuy={handleFloorBuy}
              onSell={handleFloorSell}
              onOpenTicker={(tickerId) => { setDetailId(tickerId); setTf('5m'); }}
              onToast={onToast}
            />

            {!isLive && (
              <button
                type="button"
                onClick={onBack}
                style={s(`border:0;border-radius:15px;background:${brand};color:#fff;font:700 13px 'Fredoka';padding:13px 0;cursor:pointer;box-shadow:0 5px 12px rgba(106,90,205,.26)`)}
              >
                Shop the next bell
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
