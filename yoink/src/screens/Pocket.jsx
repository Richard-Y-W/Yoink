import { useEffect, useState } from 'react';
import { s } from '../style.js';
import Mochi from '../components/Mochi.jsx';
import { sets, streak as streakWeek, pocketItems } from '../data.js';
import { claimAllowance, fetchCollection } from '../api.js';

const coinBadge = 'radial-gradient(circle at 35% 28%,#FFE9A8,#FFC700 62%,#E0A400)';

export default function Pocket({ balance = 0, streak = 0, canClaim = false, onWallet = () => {}, cartCount = 0, onAddToCart = () => {}, onOpenCart = () => {}, onToast = () => {} }) {
  const [collection, setCollection] = useState([]);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(null);
  const [justAdded, setJustAdded] = useState(null);
  const [query, setQuery] = useState('');
  const [priceSort, setPriceSort] = useState(false);

  const searchTerm = query.trim().toLowerCase();
  const parsePrice = (item) => Number(String(item.price).replace(/,/g, '')) || 0;
  const visibleCollection = searchTerm
    ? collection.filter((item) => item.title.toLowerCase().includes(searchTerm))
    : collection;
  const visibleShopItems = (searchTerm
    ? pocketItems.filter((item) => item.name.toLowerCase().includes(searchTerm))
    : pocketItems
  ).slice().sort((a, b) => (priceSort ? parsePrice(a) - parsePrice(b) : 0));

  const handleAdd = (item) => {
    onAddToCart(item);
    setJustAdded(item.id);
    window.setTimeout(() => setJustAdded((current) => (current === item.id ? null : current)), 900);
  };

  useEffect(() => {
    fetchCollection().then((data) => {
      if (Array.isArray(data.collection)) setCollection(data.collection);
    }).catch(() => {});
  }, []);

  const handleClaim = async () => {
    if (claiming || !canClaim) return;
    setClaiming(true);
    try {
      const result = await claimAllowance();
      if (result.ok) {
        setClaimed({ amount: result.amount, bonus: result.bonus });
        if (result.wallet) onWallet(result.wallet);
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div style={s("min-height:100%;background:#F1FBF8;display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:#1E1233")}>

      {/* ── header ── */}
      <div style={s("position:sticky;top:0;z-index:30;background:#EAFBF6;padding:47px 14px 12px;box-shadow:0 4px 16px rgba(16,181,160,.12)")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:11px")}>
          <div style={s("font:700 23px 'Fredoka';color:#10B5A0;letter-spacing:.3px")}>Yoink<span style={s("color:#FFC700")}>!</span></div>
          <div style={s("display:flex;align-items:center;gap:7px")}>
            <div style={s("display:flex;align-items:center;gap:6px;background:#fff;border:1.5px solid #FFE39A;border-radius:999px;padding:5px 11px 5px 6px")}>
              <span style={s(`width:18px;height:18px;border-radius:50%;background:${coinBadge};display:inline-flex;align-items:center;justify-content:center;font:700 10px 'Fredoka';color:#8A5A00;box-shadow:0 1px 0 #C98B00;flex:none`)}>Y</span>
              <span style={s("font:700 13px 'Fredoka';color:#9A6B00")}>{balance.toLocaleString()}</span>
            </div>
            <div style={s("display:flex;align-items:center;gap:3px;background:#fff;border:1.5px solid #FFC2A8;border-radius:999px;padding:5px 9px 5px 7px")}>
              <span className="mi" style={s("font-size:17px;color:#FF6B3D;font-variation-settings:'FILL' 1")}>local_fire_department</span><span style={s("font:700 13px 'Fredoka';color:#D2491F")}>{streak}</span>
            </div>
            <button
              type="button"
              aria-label="Open cart"
              onClick={onOpenCart}
              style={s("position:relative;width:38px;height:38px;border:0;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0")}
            >
              <span className="mi" style={s("font-size:22px;color:#1E1233")}>shopping_bag</span>
              <span style={s("position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#10B5A0;color:#fff;font:700 10px 'Fredoka';display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #EAFBF6")}>{cartCount}</span>
            </button>
          </div>
        </div>
        <div style={s("display:flex;gap:8px;align-items:center")}>
          <div style={s("flex:1;display:flex;align-items:center;gap:8px;background:#fff;border-radius:14px;padding:0 13px;height:44px")}>
            <span className="mi" style={s("font-size:20px;color:#9A8FA6")}>search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search collectibles…"
              aria-label="Search collectibles"
              style={s("flex:1;min-width:0;border:0;background:transparent;font:600 13.5px 'Nunito';color:#1E1233;outline:none")}
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')} style={s("border:0;background:transparent;padding:0;display:flex;cursor:pointer;color:#9A8FA6")}>
                <span className="mi" style={s("font-size:18px")}>close</span>
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label={priceSort ? 'Sorted by price — tap to reset' : 'Sort by price'}
            aria-pressed={priceSort}
            onClick={() => setPriceSort((current) => !current)}
            style={s(`width:44px;height:44px;border:0;border-radius:14px;background:${priceSort ? '#10B5A0' : '#D6F6EF'};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s ease`)}
          >
            <span className="mi" style={s(`font-size:22px;color:${priceSort ? '#fff' : '#10B5A0'}`)}>{priceSort ? 'swap_vert' : 'tune'}</span>
          </button>
        </div>
      </div>

      {/* ── content ── */}
      <div style={s("flex:1;padding:14px 14px 98px;display:flex;flex-direction:column;gap:15px")}>

        {/* level card */}
        <div style={s("border-radius:20px;padding:15px;background:linear-gradient(135deg,#10B5A0,#3FD6B0);box-shadow:0 12px 24px rgba(16,181,160,.3);color:#fff")}>
          <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px")}>
            <div style={s("display:flex;align-items:center;gap:10px")}>
              <div style={s("width:42px;height:42px;border-radius:13px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font:700 18px 'Fredoka';border:2px solid rgba(255,255,255,.5)")}>7</div>
              <div><div style={s("font:700 16px 'Fredoka'")}>Level 7</div><div style={s("font:600 11.5px 'Nunito';opacity:.9")}>Collector rank</div></div>
            </div>
            <button
              type="button"
              onClick={() => onToast('320 XP to go — the Level 8 chest unlocks then!')}
              style={s("display:flex;align-items:center;gap:5px;border:0;background:rgba(255,255,255,.2);color:#fff;padding:6px 11px;border-radius:11px;cursor:pointer")}
            ><span className="mi" style={s("font-size:18px;color:#FFD23F;font-variation-settings:'FILL' 1")}>redeem</span><span style={s("font:700 12px 'Fredoka'")}>Reward</span></button>
          </div>
          <div style={s("height:9px;border-radius:99px;background:rgba(255,255,255,.28);overflow:hidden;margin-bottom:6px")}><div style={s("height:100%;width:68%;background:#FFD23F;border-radius:99px;box-shadow:0 0 8px rgba(255,210,63,.6)")} /></div>
          <div style={s("font:600 11px 'Nunito';opacity:.92")}>320 XP to Level 8</div>
        </div>

        {/* streak card */}
        <div style={s("position:relative;border-radius:18px;padding:13px 14px;background:#fff;box-shadow:0 4px 14px rgba(30,18,51,.06)")}>
          <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px")}>
            <div style={s("display:flex;align-items:center;gap:6px")}><span className="mi" style={s("font-size:20px;color:#FF6B3D;font-variation-settings:'FILL' 1")}>local_fire_department</span><span style={s("font:700 14px 'Fredoka';color:#1E1233")}>{streak}-day streak!</span></div>
            {canClaim ? (
              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming}
                style={s(`border:0;display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#FF6B3D,#FF3D9A);color:#fff;font:700 12px 'Fredoka';padding:8px 13px;border-radius:11px;box-shadow:0 3px 0 #C93A17;cursor:pointer;${claiming ? 'opacity:.7' : ''}`)}
              >
                <span className="mi" style={s("font-size:15px;font-variation-settings:'FILL' 1")}>redeem</span>
                {claiming ? 'Claiming…' : 'Claim daily coins'}
              </button>
            ) : claimed ? (
              <div style={s("font:700 12px 'Fredoka';color:#10B5A0;animation:ypop .45s ease both")}>
                +{claimed.amount + claimed.bonus} coins{claimed.bonus > 0 ? ' (streak bonus!)' : ''}
              </div>
            ) : (
              <div style={s("display:inline-flex;align-items:center;gap:4px;font:700 12px 'Fredoka';color:#10B5A0")}>
                <span className="mi" style={s("font-size:15px;font-variation-settings:'FILL' 1")}>check_circle</span>
                Claimed today
              </div>
            )}
          </div>
          <div style={s("display:flex;justify-content:space-between")}>
            {streakWeek.map((day, i) => (
              <div key={i} style={s("display:flex;flex-direction:column;align-items:center;gap:5px")}>
                {day.done && (
                  <div style={s("width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#FF6B3D,#FF3D9A);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(255,61,154,.28)")}><span className="mi" style={s("font-size:17px;color:#fff;font-variation-settings:'FILL' 1")}>check</span></div>
                )}
                {day.todo && (
                  <div style={s("width:30px;height:30px;border-radius:50%;background:#F4EEF4;border:2px dashed #D8C8D8")} />
                )}
                <span style={s("font:700 10px 'Nunito';color:#9A8FA6")}>{day.d}</span>
              </div>
            ))}
          </div>
        </div>

        {collection.length > 0 && (
          <>
            <div style={s("display:flex;align-items:baseline;justify-content:space-between")}>
              <div style={s("font:700 18px 'Fredoka';color:#1E1233")}>Fresh from the mail</div>
              <div style={s("font:700 13px 'Nunito';color:#10B5A0")}>{collection.length} yoink&#8217;d</div>
            </div>
            <div style={s("display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px")}>
              {visibleCollection.map((item) => (
                <div key={item.id} style={s("background:#fff;border-radius:16px;padding:7px;box-shadow:0 4px 14px rgba(30,18,51,.06);animation:ypop .4s ease both")}>
                  <div style={s(`position:relative;aspect-ratio:1/1;border-radius:11px;overflow:hidden;background:${item.imageStripe}`)}>
                    {item.quantity > 1 && (
                      <span style={s("position:absolute;top:4px;right:4px;min-width:19px;height:19px;padding:0 4px;border-radius:999px;background:#10B5A0;color:#fff;font:700 10px 'Fredoka';display:flex;align-items:center;justify-content:center")}>
                        x{item.quantity}
                      </span>
                    )}
                    <div style={s("position:absolute;bottom:4px;right:4px;width:17px;height:17px;border-radius:50%;background:#10B5A0;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.2)")}>
                      <span className="mi" style={s("font-size:12px;color:#fff;font-variation-settings:'FILL' 1")}>check</span>
                    </div>
                  </div>
                  <div style={s("font:700 10.5px/1.25 'Nunito';color:#1E1233;margin-top:6px;height:26px;overflow:hidden")}>{item.title}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={s("display:flex;align-items:baseline;justify-content:space-between")}>
          <div style={s("font:700 18px 'Fredoka';color:#1E1233")}>Your collections</div>
          <button
            type="button"
            onClick={() => onToast('Both sets are here — finish one for the coin bonus!')}
            style={s("border:0;background:transparent;padding:0;font:700 13px 'Nunito';color:#10B5A0;cursor:pointer")}
          >
            See all
          </button>
        </div>

        {/* collection sets */}
        {sets.map((set) => (
          <div key={set.id} style={s("background:#fff;border-radius:20px;padding:14px;box-shadow:0 4px 14px rgba(30,18,51,.06)")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:11px")}>
              <div style={s("font:700 15px 'Fredoka';color:#1E1233")}>{set.name}</div>
              <div style={s(`font:700 12px 'Fredoka';color:${set.accent}`)}>{set.have}/{set.total}</div>
            </div>
            <div style={s("display:flex;gap:7px;margin-bottom:12px")}>
              {set.thumbs.map((th, i) => (
                <div key={i} style={s(`position:relative;flex:1;aspect-ratio:1/1;border-radius:11px;overflow:hidden;background:${th.stripe}`)}>
                  {th.locked && (
                    <div style={s("position:absolute;inset:0;background:rgba(245,240,245,.82);display:flex;align-items:center;justify-content:center")}><span className="mi" style={s("font-size:17px;color:#B9AEC2")}>lock</span></div>
                  )}
                  {th.o && (
                    <div style={s("position:absolute;bottom:3px;right:3px;width:16px;height:16px;border-radius:50%;background:#10B5A0;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.2)")}><span className="mi" style={s("font-size:11px;color:#fff;font-variation-settings:'FILL' 1")}>check</span></div>
                  )}
                </div>
              ))}
            </div>
            <div style={s("display:flex;align-items:center;gap:10px")}>
              <div style={s("flex:1;height:8px;border-radius:99px;background:#F0E6F0;overflow:hidden")}><div style={s(`height:100%;width:${set.pct}%;background:linear-gradient(90deg,#10B5A0,#3FD6B0);border-radius:99px`)} /></div>
              <div style={s("font:700 11px 'Nunito';color:#6B5E76")}><span style={s("color:#EFA100")}>+{set.reward}</span> at full set</div>
            </div>
          </div>
        ))}

        <div style={s("font:700 18px 'Fredoka';color:#1E1233;margin-top:2px")}>Add to your collection</div>
        <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:13px")}>
          {visibleShopItems.map((item) => (
            <div key={item.id} style={s("background:#fff;border-radius:22px;box-shadow:0 5px 0 rgba(30,18,51,.05),0 12px 22px rgba(30,18,51,.07);padding:10px")}>
              <div style={s(`position:relative;aspect-ratio:1.1/1;border-radius:15px;overflow:hidden;background:${item.stripe};margin-bottom:9px`)}>
                <div style={s("position:absolute;bottom:6px;left:50%;transform:translateX(-50%);padding:2px 8px;border-radius:7px;background:rgba(255,255,255,.85);font:600 9.5px ui-monospace,Menlo,monospace;color:#6B5E76;white-space:nowrap")}>{item.img}</div>
              </div>
              <div style={s("font:700 13px/1.25 'Nunito';height:33px;overflow:hidden;color:#1E1233;padding:0 2px")}>{item.name}</div>
              <div style={s("display:flex;align-items:center;justify-content:space-between;margin-top:7px")}>
                <div style={s("display:flex;align-items:center;gap:4px")}>
                  <span style={s(`width:17px;height:17px;border-radius:50%;background:${coinBadge};display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:#8A5A00;box-shadow:0 1px 0 #C98B00;flex:none`)}>Y</span>
                  <span style={s("font:700 15px 'Fredoka';color:#1E1233")}>{item.price}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  style={s(`display:flex;align-items:center;gap:2px;border:0;background:${justAdded === item.id ? '#0B8576' : '#10B5A0'};color:#fff;font:700 12px 'Fredoka';padding:7px 12px;border-radius:12px;box-shadow:0 4px 0 #0B8576;cursor:pointer;${justAdded === item.id ? 'animation:ypop .35s ease both' : ''}`)}
                >
                  <span className="mi" style={s("font-size:15px")}>{justAdded === item.id ? 'check' : 'add'}</span>
                  {justAdded === item.id ? 'In cart' : 'Add'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={s("display:flex;justify-content:flex-start;margin-top:2px")}>
          <Mochi color="#10B5A0" say="3 more to finish the Retro set!" size={54} />
        </div>

      </div>
    </div>
  );
}
