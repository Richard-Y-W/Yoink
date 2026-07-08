import { useEffect, useState } from 'react';
import { s } from '../style.js';
import ItemArt from '../components/ItemArt.jsx';
import Mochi from '../components/Mochi.jsx';
import { sets, pocketItems } from '../data.js';
import { claimAccount, ensureSession, fetchCollection, loginAccount, logoutAccount } from '../api.js';
import { artStageBackground, resolveArtKind } from '../itemArt.js';
import { marketTheme } from '../marketTheme.js';

const {
  ink,
  wash,
  line,
  muted,
  brand,
  currencyButtonBackground,
  cartCountBackground,
  attentionBadgeBackground,
  attentionBadgeText,
} = marketTheme;

// Guest-first account card: guests get a nudge to save their progress
// (claim = attach username + password to the same account) or sign in to
// one they made on another device; claimed accounts just show who's in.
function AccountCard({ account, onAccountChange, onToast }) {
  const [mode, setMode] = useState('idle'); // idle | claim | login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const inputStyle = s(`width:100%;box-sizing:border-box;height:44px;border:1.5px solid ${line};border-radius:12px;background:${wash};padding:0 13px;font:600 13.5px 'Nunito';color:${ink};outline:none`);
  const primaryButton = s(`flex:1;height:42px;border:0;border-radius:12px;background:${brand};color:#fff;font:700 13.5px 'Fredoka';cursor:pointer`);
  const ghostButton = s(`flex:1;height:42px;border:1.5px solid ${line};border-radius:12px;background:#fff;color:${ink};font:700 13.5px 'Fredoka';cursor:pointer`);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const action = mode === 'claim' ? claimAccount : loginAccount;
    const result = await action(username.trim(), password).catch(() => null);
    setBusy(false);
    if (!result?.ok) {
      onToast(result?.error ?? 'Something went wrong — try again');
      return;
    }
    onToast(mode === 'claim' ? 'Account saved — your pocket is safe!' : `Welcome back, @${result.user.username}!`);
    setMode('idle');
    setUsername('');
    setPassword('');
    onAccountChange(result.user);
  };

  const logout = async () => {
    await logoutAccount().catch(() => {});
    const user = await ensureSession().catch(() => null);
    onAccountChange(user);
    onToast('Logged out — playing as a guest');
  };

  if (!account) return null;

  return (
    <div style={s("background:#fff;border-radius:20px;padding:14px;border:1px solid #EDEAF6;box-shadow:0 2px 8px rgba(23,19,38,.05)")}>
      {account.guest ? (
        <>
          <div style={s("display:flex;align-items:center;gap:9px;margin-bottom:4px")}>
            <span className="mi" style={s(`font-size:20px;color:${brand};font-variation-settings:'FILL' 1`)}>shield</span>
            <div style={s(`font:700 15px 'Fredoka';color:${ink}`)}>Playing as guest</div>
          </div>
          <div style={s(`font:600 12.5px/1.45 'Nunito';color:${muted};margin-bottom:11px`)}>
            Save your account to keep your coins and collection forever — and to sign in from other devices.
          </div>
          {mode === 'idle' ? (
            <div style={s("display:flex;gap:8px")}>
              <button type="button" onClick={() => setMode('claim')} style={primaryButton}>Save account</button>
              <button type="button" onClick={() => setMode('login')} style={ghostButton}>Sign in</button>
            </div>
          ) : (
            <div style={s("display:flex;flex-direction:column;gap:8px")}>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                aria-label="Username"
                autoCapitalize="none"
                style={inputStyle}
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'claim' ? 'Password (8+ characters)' : 'Password'}
                aria-label="Password"
                type="password"
                style={inputStyle}
              />
              <div style={s("display:flex;gap:8px")}>
                <button type="button" onClick={submit} disabled={busy} style={primaryButton}>
                  {busy ? '…' : mode === 'claim' ? 'Save account' : 'Sign in'}
                </button>
                <button type="button" onClick={() => setMode('idle')} style={ghostButton}>Cancel</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={s("display:flex;align-items:center;gap:10px")}>
          <span className="mi" style={s(`font-size:22px;color:${brand};font-variation-settings:'FILL' 1`)}>account_circle</span>
          <div style={s("flex:1;min-width:0")}>
            <div style={s(`font:700 14.5px 'Fredoka';color:${ink}`)}>@{account.username}</div>
            <div style={s(`font:600 11.5px 'Nunito';color:${muted}`)}>Signed in — progress synced</div>
          </div>
          <button type="button" onClick={logout} style={s(`border:1.5px solid ${line};border-radius:11px;background:#fff;color:${ink};font:700 12px 'Fredoka';padding:8px 12px;cursor:pointer`)}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Pocket({ balance = 0, streak = 0, cartCount = 0, onAddToCart = () => {}, onOpenCart = () => {}, onToast = () => {}, artStyle = 'vinyl', account = null, onAccountChange = () => {} }) {
  const [collection, setCollection] = useState([]);
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
  }, [account?.id]);

  return (
    <div style={s(`min-height:100%;background:${wash};display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:${ink}`)}>

      {/* ── header ── */}
      <div style={s("position:sticky;top:0;z-index:30;background:#fff;padding:47px 13px 11px;box-shadow:0 3px 14px rgba(23,19,38,.06)")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:10px")}>
          <div style={s(`font:700 23px 'Fredoka';color:${brand};letter-spacing:.2px`)}>Yoink!</div>
          <div style={s("display:flex;align-items:center;gap:7px")}>
            <div style={s(`display:flex;align-items:center;gap:5px;background:${currencyButtonBackground};border:1.5px solid ${currencyButtonBackground};border-radius:999px;padding:4px 10px 4px 5px`)}>
              <span style={s(`width:16px;height:16px;border-radius:50%;background:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:${currencyButtonBackground};flex:none`)}>Y</span>
              <span style={s("font:700 12px 'Fredoka';color:#fff")}>{balance.toLocaleString()}</span>
            </div>
            <div style={s(`display:flex;align-items:center;gap:3px;background:${attentionBadgeBackground};border-radius:999px;padding:4px 9px 4px 6px`)}>
              <span className="mi" style={s(`font-size:16px;color:${attentionBadgeText};font-variation-settings:'FILL' 1`)}>local_fire_department</span><span style={s(`font:700 12px 'Fredoka';color:${attentionBadgeText}`)}>{streak}</span>
            </div>
            <button
              type="button"
              aria-label="Open cart"
              onClick={onOpenCart}
              style={s(`position:relative;width:36px;height:36px;border:0;border-radius:11px;background:${wash};display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0`)}
            >
              <span className="mi" style={s(`font-size:21px;color:${ink}`)}>shopping_cart</span>
              <span style={s(`position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:${cartCountBackground};color:#fff;font:700 9.5px 'Fredoka';display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff`)}>{cartCount}</span>
            </button>
          </div>
        </div>
        <div style={s("display:flex;gap:8px;align-items:center")}>
          <div style={s(`flex:1;display:flex;align-items:center;gap:8px;background:${wash};border:1.5px solid ${line};border-radius:12px;padding:0 13px;height:44px`)}>
            <span className="mi" style={s(`font-size:20px;color:${muted}`)}>search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search collectibles…"
              aria-label="Search collectibles"
              style={s(`flex:1;min-width:0;border:0;background:transparent;font:600 13.5px 'Nunito';color:${ink};outline:none`)}
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')} style={s(`border:0;background:transparent;padding:0;display:flex;cursor:pointer;color:${muted}`)}>
                <span className="mi" style={s("font-size:18px")}>close</span>
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label={priceSort ? 'Sorted by price — tap to reset' : 'Sort by price'}
            aria-pressed={priceSort}
            onClick={() => setPriceSort((current) => !current)}
            style={s(`width:44px;height:44px;border:1.5px solid ${priceSort ? brand : line};border-radius:12px;background:${priceSort ? brand : wash};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s ease`)}
          >
            <span className="mi" style={s(`font-size:22px;color:${priceSort ? '#fff' : brand}`)}>{priceSort ? 'swap_vert' : 'tune'}</span>
          </button>
        </div>
      </div>

      {/* ── content ── */}
      <div style={s("flex:1;padding:14px 14px 98px;display:flex;flex-direction:column;gap:15px")}>

        <AccountCard account={account} onAccountChange={onAccountChange} onToast={onToast} />

        {collection.length > 0 && (
          <>
            <div style={s("display:flex;align-items:baseline;justify-content:space-between")}>
              <div style={s(`font:700 18px 'Fredoka';color:${ink}`)}>Fresh from the mail</div>
              <div style={s(`font:700 13px 'Nunito';color:${brand}`)}>{collection.length} yoink&#8217;d</div>
            </div>
            <div style={s("display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px")}>
              {visibleCollection.map((item) => (
                <div key={item.id} style={s("background:#fff;border-radius:16px;padding:7px;border:1px solid #EDEAF6;box-shadow:0 2px 8px rgba(23,19,38,.05);animation:ypop .4s ease both")}>
                  <div style={s(`position:relative;aspect-ratio:1/1;border-radius:11px;overflow:hidden;background:${item.imageStripe}`)}>
                    {item.quantity > 1 && (
                      <span style={s(`position:absolute;top:4px;right:4px;min-width:19px;height:19px;padding:0 4px;border-radius:999px;background:${brand};color:#fff;font:700 10px 'Fredoka';display:flex;align-items:center;justify-content:center`)}>
                        x{item.quantity}
                      </span>
                    )}
                    <div style={s(`position:absolute;bottom:4px;right:4px;width:17px;height:17px;border-radius:50%;background:${brand};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.2)`)}>
                      <span className="mi" style={s("font-size:12px;color:#fff;font-variation-settings:'FILL' 1")}>check</span>
                    </div>
                  </div>
                  <div style={s(`font:700 10.5px/1.25 'Nunito';color:${ink};margin-top:6px;height:26px;overflow:hidden`)}>{item.title}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={s("display:flex;align-items:baseline;justify-content:space-between")}>
          <div style={s(`font:700 18px 'Fredoka';color:${ink}`)}>Your collections</div>
          <button
            type="button"
            onClick={() => onToast('Both sets are here — finish one for the coin bonus!')}
            style={s(`border:0;background:transparent;padding:0;font:700 13px 'Nunito';color:${brand};cursor:pointer`)}
          >
            See all
          </button>
        </div>

        {/* collection sets */}
        {sets.map((set) => (
          <div key={set.id} style={s("background:#fff;border-radius:20px;padding:14px;border:1px solid #EDEAF6;box-shadow:0 2px 8px rgba(23,19,38,.05)")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:11px")}>
              <div style={s(`font:700 15px 'Fredoka';color:${ink}`)}>{set.name}</div>
              <div style={s(`font:700 12px 'Fredoka';color:${set.accent}`)}>{set.have}/{set.total}</div>
            </div>
            <div style={s("display:flex;gap:7px;margin-bottom:12px")}>
              {set.thumbs.map((th, i) => (
                <div key={i} style={s(`position:relative;flex:1;aspect-ratio:1/1;border-radius:11px;overflow:hidden;background:${th.stripe}`)}>
                  {th.locked && (
                    <div style={s("position:absolute;inset:0;background:rgba(245,243,255,.85);display:flex;align-items:center;justify-content:center")}><span className="mi" style={s(`font-size:17px;color:${muted}`)}>lock</span></div>
                  )}
                  {th.o && (
                    <div style={s(`position:absolute;bottom:3px;right:3px;width:16px;height:16px;border-radius:50%;background:${brand};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.2)`)}><span className="mi" style={s("font-size:11px;color:#fff;font-variation-settings:'FILL' 1")}>check</span></div>
                  )}
                </div>
              ))}
            </div>
            <div style={s("display:flex;align-items:center;gap:10px")}>
              <div style={s(`flex:1;height:8px;border-radius:99px;background:${line};overflow:hidden`)}><div style={s(`height:100%;width:${set.pct}%;background:linear-gradient(90deg,${brand},#8B78E6);border-radius:99px`)} /></div>
              <div style={s(`display:flex;align-items:center;gap:4px;font:700 11px 'Nunito';color:${muted}`)}><span style={s(`background:${attentionBadgeBackground};color:${attentionBadgeText};padding:1px 6px;border-radius:5px`)}>+{set.reward}</span> at full set</div>
            </div>
          </div>
        ))}

        <div style={s(`font:700 18px 'Fredoka';color:${ink};margin-top:2px`)}>Add to your collection</div>
        <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:13px")}>
          {visibleShopItems.map((item) => {
            const artKind = resolveArtKind(item);
            return (
            <div key={item.id} style={s("background:#fff;border-radius:22px;border:1px solid #EDEAF6;box-shadow:0 2px 8px rgba(23,19,38,.05);padding:10px")}>
              <div style={s(`position:relative;aspect-ratio:1.1/1;border-radius:15px;overflow:hidden;background:${artKind ? artStageBackground(artStyle, artKind) : item.stripe};margin-bottom:9px;display:flex;align-items:center;justify-content:center`)}>
                {artKind && <ItemArt kind={artKind} artStyle={artStyle} width={118} />}
                <div style={s("position:absolute;bottom:6px;left:50%;transform:translateX(-50%);padding:2px 8px;border-radius:7px;background:rgba(255,255,255,.85);font:600 9.5px ui-monospace,Menlo,monospace;color:#6E6A7A;white-space:nowrap")}>{item.img}</div>
              </div>
              <div style={s(`font:700 13px/1.25 'Nunito';height:33px;overflow:hidden;color:${ink};padding:0 2px`)}>{item.name}</div>
              <div style={s("display:flex;align-items:center;justify-content:space-between;margin-top:7px")}>
                <div style={s("display:flex;align-items:center;gap:4px")}>
                  <span style={s(`width:17px;height:17px;border-radius:50%;background:${ink};display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:#fff;flex:none`)}>Y</span>
                  <span style={s(`font:700 15px 'Fredoka';color:${ink}`)}>{item.price}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  style={s(`display:flex;align-items:center;gap:2px;border:0;background:${justAdded === item.id ? '#584AAE' : brand};color:#fff;font:700 12px 'Fredoka';padding:7px 12px;border-radius:12px;box-shadow:0 4px 10px rgba(106,90,205,.34);cursor:pointer;${justAdded === item.id ? 'animation:ypop .35s ease both' : ''}`)}
                >
                  <span className="mi" style={s("font-size:15px")}>{justAdded === item.id ? 'check' : 'add'}</span>
                  {justAdded === item.id ? 'In cart' : 'Add'}
                </button>
              </div>
            </div>
            );
          })}
        </div>

        <div style={s("display:flex;justify-content:flex-start;margin-top:2px")}>
          <Mochi color={brand} say="3 more to finish the Retro set!" size={54} />
        </div>

      </div>
    </div>
  );
}
