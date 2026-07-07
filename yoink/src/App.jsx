import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { s } from './style.js';
import { scrollToScreenTop } from './appScroll.js';
import { HAPTIC_EVENTS, emitHaptic } from './hapticFeedback.js';
import { emitNativeNotification } from './notificationFeedback.js';
import {
  WATCHED_LISTINGS_STORAGE_KEY,
  parseWatchedListings,
  serializeWatchedListings,
  toggleWatchedListing,
  watchedListingIds,
} from './watchedListings.js';
import IOSDevice from './components/IOSDevice.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import OrderYoinked from './components/OrderYoinked.jsx';
import UltraSignalPreview from './components/UltraSignalPreview.jsx';
import YoinkNav from './components/YoinkNav.jsx';
import { addListingToCart, decrementCartItem, getCartQuantity } from './cart.js';
import { claimAllowance, fetchOrders, fetchWallet, placeOrder, spinWheel } from './api.js';
import Account from './screens/Account.jsx';
import Checkout from './screens/Checkout.jsx';
import MonoMarket from './screens/MonoMarket.jsx';
import Orders from './screens/Orders.jsx';
import ProductDetail from './screens/ProductDetail.jsx';
import Watching from './screens/Watching.jsx';
import { ART_STYLES } from './itemArt.js';
import {
  APP_SCREENS,
  TAB_SCREENS,
  getInitialScreen,
  openCheckout,
  openOrders,
  openProductDetail,
  openTab,
  returnFromCheckout,
  returnToMarket,
} from './appFlow.js';

const TAB_ACCENTS = {
  [APP_SCREENS.home]: '#6A5ACD',
  [APP_SCREENS.search]: '#6A5ACD',
  [APP_SCREENS.orders]: '#6A5ACD',
  [APP_SCREENS.watching]: '#6A5ACD',
  [APP_SCREENS.account]: '#6A5ACD',
};

function isExpoShell() {
  try {
    return new URLSearchParams(window.location.search).get('shell') === 'expo';
  } catch {
    return false;
  }
}

function isUltraSignalPreview() {
  try {
    return new URLSearchParams(window.location.search).get('ultraSignalPreview') === '1';
  } catch {
    return false;
  }
}

function CoinRewardsSheet({
  wallet,
  busyReward,
  onClose,
  onClaimDaily,
  onClaimBonus,
}) {
  const balance = wallet?.balance ?? 0;
  const streak = wallet?.streak ?? 0;
  const canClaim = Boolean(wallet?.canClaim);
  const canSpin = Boolean(wallet?.canSpin);

  return (
    <div style={s('position:absolute;inset:0;z-index:960;background:rgba(23,19,38,.26);display:flex;align-items:flex-end;justify-content:center;animation:ypop .18s ease both')}>
      <button
        type="button"
        aria-label="Close Yoink rewards"
        onClick={onClose}
        style={s('position:absolute;inset:0;border:0;background:transparent;cursor:pointer')}
      />
      <section style={s("position:relative;width:100%;background:#fff;border-radius:22px 22px 0 0;padding:16px 16px 24px;box-shadow:0 -12px 34px rgba(23,19,38,.22);font-family:'Nunito',sans-serif;color:#171326")}>
        <div style={s('display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px')}>
          <div style={s('display:flex;align-items:center;gap:10px')}>
            <span style={s("width:46px;height:46px;border-radius:16px;background:#6A5ACD;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 0 #4B3BA6;font:900 22px 'Fredoka';color:#fff")}>Y</span>
            <span>
              <span style={s("display:block;font:900 20px 'Fredoka';color:#171326")}>Yoink Coins</span>
              <span style={s("display:block;font:800 12px 'Nunito';color:#7A7686")}>Balance Y {balance.toLocaleString()} · {streak} day streak</span>
            </span>
          </div>
          <button type="button" aria-label="Close rewards" onClick={onClose} style={s('border:0;background:#F4F0FF;border-radius:12px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer')}>
            <span className="mi" style={s('font-size:20px;color:#171326')}>close</span>
          </button>
        </div>

        <div style={s('display:grid;gap:10px')}>
          <button
            type="button"
            disabled={!canClaim || busyReward === 'daily'}
            onClick={onClaimDaily}
            style={s(`border:1.5px solid ${canClaim ? '#DCD5EF' : '#EEEAF6'};background:${canClaim ? '#F7F3FF' : '#F8F7FB'};border-radius:14px;padding:13px;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;cursor:${canClaim ? 'pointer' : 'default'};opacity:${busyReward === 'daily' ? '.72' : '1'}`)}
          >
            <span style={s('display:flex;align-items:center;gap:10px;min-width:0')}>
              <span style={s('width:38px;height:38px;border-radius:13px;background:#FFF3D1;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(255,184,77,.28)')}>
                <span className="mi" style={s("font-size:21px;color:#C87900;font-variation-settings:'FILL' 1")}>redeem</span>
              </span>
              <span style={s('min-width:0')}>
                <span style={s("display:block;font:900 14px 'Fredoka';color:#171326")}>Claim daily coins</span>
                <span style={s("display:block;font:800 11.5px 'Nunito';color:#7A7686")}>{canClaim ? 'Fresh allowance is ready' : 'Daily reward already claimed'}</span>
              </span>
            </span>
            <span className="mi" style={s('font-size:20px;color:#6A5ACD')}>chevron_right</span>
          </button>

          <button
            type="button"
            disabled={!canSpin || busyReward === 'bonus'}
            onClick={onClaimBonus}
            style={s(`border:1.5px solid ${canSpin ? '#DCD5EF' : '#EEEAF6'};background:${canSpin ? '#FFF8E7' : '#F8F7FB'};border-radius:14px;padding:13px;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;cursor:${canSpin ? 'pointer' : 'default'};opacity:${busyReward === 'bonus' ? '.72' : '1'}`)}
          >
            <span style={s('display:flex;align-items:center;gap:10px;min-width:0')}>
              <span style={s('width:38px;height:38px;border-radius:13px;background:#FFE4F1;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(255,61,154,.20)')}>
                <span className="mi" style={s("font-size:21px;color:#FF3D9A;font-variation-settings:'FILL' 1")}>auto_awesome</span>
              </span>
              <span style={s('min-width:0')}>
                <span style={s("display:block;font:900 14px 'Fredoka';color:#171326")}>Have some on us</span>
                <span style={s("display:block;font:800 11.5px 'Nunito';color:#7A7686")}>{canSpin ? 'One bonus coin pull today' : 'Bonus pull resets tomorrow'}</span>
              </span>
            </span>
            <span className="mi" style={s('font-size:20px;color:#6A5ACD')}>chevron_right</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  if (isUltraSignalPreview()) return <UltraSignalPreview />;
  return <YoinkApp />;
}

function YoinkApp() {
  const nativeShell = isExpoShell();
  const [flow, setFlow] = useState(() => ({
    screen: getInitialScreen(),
    selectedListing: null,
  }));
  const [cartItems, setCartItems] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, streak: 0, canClaim: false, canSpin: false });
  const [yoinkedOrder, setYoinkedOrder] = useState(null);
  const [ordersInFlight, setOrdersInFlight] = useState(0);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [busyReward, setBusyReward] = useState(null);
  const [watchedListings, setWatchedListings] = useState(() => {
    try {
      return parseWatchedListings(window.localStorage.getItem(WATCHED_LISTINGS_STORAGE_KEY));
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const screenRootRef = useRef(null);
  const placingOrderRef = useRef(false);
  const [artStyle, setArtStyle] = useState(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('art');
      if (ART_STYLES.includes(fromUrl)) return fromUrl;
      const saved = window.localStorage.getItem('yoink-art-style');
      return ART_STYLES.includes(saved) ? saved : 'vinyl';
    } catch {
      return 'vinyl';
    }
  });

  const cycleArtStyle = useCallback(() => {
    setArtStyle((current) => {
      const next = ART_STYLES[(ART_STYLES.indexOf(current) + 1) % ART_STYLES.length];
      try {
        window.localStorage.setItem('yoink-art-style', next);
      } catch {}
      return next;
    });
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const refreshWallet = useCallback(() => {
    fetchWallet().then((next) => {
      if (next && typeof next.balance === 'number') setWallet(next);
    }).catch(() => {});
  }, []);

  const refreshOrdersBadge = useCallback(() => {
    fetchOrders().then((data) => {
      if (data.orders) setOrdersInFlight(data.orders.filter((order) => order.stage !== 'delivered').length);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    refreshWallet();
    refreshOrdersBadge();
    const timer = window.setInterval(refreshOrdersBadge, 5000);
    return () => {
      window.clearInterval(timer);
    };
  }, [refreshWallet, refreshOrdersBadge]);

  useLayoutEffect(() => {
    scrollToScreenTop(screenRootRef.current);
  }, [flow.screen]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WATCHED_LISTINGS_STORAGE_KEY, serializeWatchedListings(watchedListings));
    } catch {}
  }, [watchedListings]);

  const isTabScreen = TAB_SCREENS.includes(flow.screen);
  const isProductDetail = flow.screen === APP_SCREENS.productDetail;
  const isCheckout = flow.screen === APP_SCREENS.checkout;
  const cartCount = getCartQuantity(cartItems);
  const addToCart = (listing, quantity = 1) => {
    emitHaptic(HAPTIC_EVENTS.success);
    setCartItems((current) => addListingToCart(current, listing, quantity));
  };
  const handleDecreaseCartItem = useCallback((itemId) => {
    emitHaptic(HAPTIC_EVENTS.tap);
    setCartItems((current) => decrementCartItem(current, itemId));
  }, []);
  const watchedIds = useMemo(() => watchedListingIds(watchedListings), [watchedListings]);
  const handleOpenCart = () => {
    emitHaptic(HAPTIC_EVENTS.cart);
    setFlow((current) => openCheckout(current));
  };
  const handleOpenWallet = () => {
    emitHaptic(HAPTIC_EVENTS.tap);
    setRewardsOpen(true);
  };
  const handleCloseCheckout = () => setFlow((current) => returnFromCheckout(current));
  const handleSelectTab = (tab) => {
    if (tab === APP_SCREENS.orders) {
      emitHaptic(HAPTIC_EVENTS.orders);
    } else {
      emitHaptic(HAPTIC_EVENTS.tab);
    }
    setFlow((current) => openTab(current, tab));
  };
  const handleSearchSubmit = useCallback(() => {
    emitHaptic(HAPTIC_EVENTS.searchSubmit);
  }, []);
  const handleMarketPageLoad = useCallback(() => {
    emitHaptic(HAPTIC_EVENTS.loaderPageLoad);
  }, []);
  const handleRareFlash = useCallback(() => {
    emitHaptic(HAPTIC_EVENTS.rareFlash);
  }, []);
  const handleUltraRareFlash = useCallback((item) => {
    emitHaptic(HAPTIC_EVENTS.ultraDrop);
    emitNativeNotification({
      title: 'Ultra rare drop!',
      body: `${item?.name ?? 'A rare item'} just surfaced in Yoink.`,
    });
  }, []);
  const handleDeliveryUpdate = useCallback(() => {
    emitHaptic(HAPTIC_EVENTS.deliveryUpdate);
    emitNativeNotification({
      title: 'Delivery update',
      body: 'A Yoink order just moved to the next tracking stage.',
    });
    refreshOrdersBadge();
  }, [refreshOrdersBadge]);
  const handleToggleWatchedListing = useCallback((listing) => {
    const alreadyWatched = watchedIds.includes(listing?.id);
    emitHaptic(alreadyWatched ? HAPTIC_EVENTS.unwatch : HAPTIC_EVENTS.watch);
    setWatchedListings((current) => toggleWatchedListing(current, listing));
  }, [watchedIds]);

  const handlePlaceOrder = async (options) => {
    if (placingOrderRef.current) {
      return { ok: false, error: 'Already yoinking this order' };
    }
    placingOrderRef.current = true;
    try {
      const result = await placeOrder({ items: cartItems, ...options });
      if (result.ok) {
        if (result.wallet) setWallet(result.wallet);
        setYoinkedOrder(result.order);
      }
      return result;
    } finally {
      window.setTimeout(() => {
        placingOrderRef.current = false;
      }, 900);
    }
  };

  const handleClaimDaily = useCallback(async () => {
    if (busyReward) return;
    setBusyReward('daily');
    try {
      const result = await claimAllowance();
      if (result?.ok) {
        if (result.wallet) setWallet(result.wallet);
        emitHaptic(HAPTIC_EVENTS.reward);
        const bonusCopy = result.bonus ? ` plus a Y ${result.bonus.toLocaleString()} streak bonus` : '';
        showToast(`Daily Yoink coins: +Y ${result.amount.toLocaleString()}${bonusCopy}`);
        emitNativeNotification({
          title: 'Daily Yoink coins',
          body: `You claimed Y ${result.amount.toLocaleString()}${bonusCopy}.`,
        });
      } else {
        emitHaptic(HAPTIC_EVENTS.error);
        if (result?.wallet) setWallet(result.wallet);
        showToast(result?.error ?? 'Daily coins reset tomorrow.');
      }
    } catch {
      emitHaptic(HAPTIC_EVENTS.error);
      showToast('Could not claim coins right now.');
    } finally {
      setBusyReward(null);
    }
  }, [busyReward, showToast]);

  const handleClaimBonus = useCallback(async () => {
    if (busyReward) return;
    setBusyReward('bonus');
    try {
      const result = await spinWheel();
      if (result?.ok) {
        if (result.wallet) setWallet(result.wallet);
        emitHaptic(HAPTIC_EVENTS.reward);
        showToast(`Have some on us: +Y ${result.reward.toLocaleString()}`);
      } else {
        emitHaptic(HAPTIC_EVENTS.error);
        if (result?.wallet) setWallet(result.wallet);
        showToast(result?.error ?? 'Bonus pull resets tomorrow.');
      }
    } catch {
      emitHaptic(HAPTIC_EVENTS.error);
      showToast('Could not grab bonus coins right now.');
    } finally {
      setBusyReward(null);
    }
  }, [busyReward, showToast]);

  const handleYoinkDone = useCallback(() => {
    setYoinkedOrder((order) => {
      if (order) setFlow(openOrders(order.id));
      return null;
    });
    setCartItems([]);
    refreshOrdersBadge();
  }, [refreshOrdersBadge]);

  const shellClassName = nativeShell
    ? 'yoink-app-shell yoink-app-shell--native'
    : 'yoink-app-shell yoink-app-shell--preview';
  const shellStyle = nativeShell
    ? s("width:100%;min-height:100dvh;height:100dvh;margin:0;padding:0;box-sizing:border-box;display:block;overflow:visible;background:#fff")
    : s("min-height:100vh;padding:28px 24px 46px;box-sizing:border-box;display:flex;align-items:flex-start;justify-content:center");

  return (
    <div ref={screenRootRef} className={shellClassName} style={shellStyle}>
      <IOSDevice>
        <SplashScreen />
        {yoinkedOrder && (
          <OrderYoinked stripe={yoinkedOrder.items[0]?.imageStripe} onDone={handleYoinkDone} />
        )}
        {isCheckout ? (
          <Checkout
            cartItems={cartItems}
            balance={wallet.balance}
            onBack={handleCloseCheckout}
            onPlaceOrder={handlePlaceOrder}
            onDecreaseItem={handleDecreaseCartItem}
            onToast={showToast}
          />
        ) : isProductDetail ? (
          <ProductDetail
            listing={flow.selectedListing}
            onBack={() => setFlow(returnToMarket())}
            cartCount={cartCount}
            onAddToCart={(quantity) => addToCart(flow.selectedListing, quantity)}
            onOpenCart={handleOpenCart}
            onToast={showToast}
            artStyle={artStyle}
            isWatched={watchedIds.includes(flow.selectedListing?.id)}
            onToggleWatchedListing={handleToggleWatchedListing}
          />
        ) : flow.screen === APP_SCREENS.watching ? (
          <Watching
            cartCount={cartCount}
            onOpenCart={handleOpenCart}
            watchedListings={watchedListings}
            onOpenProduct={(listing, trigger) => setFlow(openProductDetail(listing, trigger))}
            onToggleWatchedListing={handleToggleWatchedListing}
            artStyle={artStyle}
          />
        ) : flow.screen === APP_SCREENS.orders ? (
          <Orders
            balance={wallet.balance}
            celebrateOrderId={flow.celebrateOrderId}
            onDeliveryUpdate={handleDeliveryUpdate}
          />
        ) : flow.screen === APP_SCREENS.account ? (
          <Account
            balance={wallet.balance}
            streak={wallet.streak}
            ordersInFlight={ordersInFlight}
            cartCount={cartCount}
            watchedCount={watchedListings.length}
            onOpenCart={handleOpenCart}
            onOpenWatching={() => handleSelectTab(APP_SCREENS.watching)}
            onOpenOrders={() => handleSelectTab(APP_SCREENS.orders)}
            onToast={showToast}
          />
        ) : (
          <MonoMarket
            onOpenProduct={(listing, trigger) => setFlow(openProductDetail(listing, trigger))}
            onOpenCart={handleOpenCart}
            onOpenWallet={handleOpenWallet}
            cartCount={cartCount}
            balance={wallet.balance}
            artStyle={artStyle}
            watchedIds={watchedIds}
            onToggleWatchedListing={handleToggleWatchedListing}
            searchMode={flow.screen === APP_SCREENS.search}
            onSearchSubmit={handleSearchSubmit}
            onPageLoad={handleMarketPageLoad}
            onRareFlash={handleRareFlash}
            onUltraRareFlash={handleUltraRareFlash}
          />
        )}
        {toast && (
          <div style={s("position:absolute;left:16px;right:16px;bottom:112px;z-index:940;display:flex;align-items:center;justify-content:center;gap:9px;width:calc(100% - 32px);max-width:360px;margin:0 auto;background:#171326;color:#fff;padding:10px 16px;border-radius:18px;box-shadow:0 10px 24px rgba(23,19,38,.35);font:700 12.5px/1.25 'Fredoka';white-space:normal;overflow-wrap:anywhere;box-sizing:border-box;animation:ypop .35s ease both")}>
            <span className="mi" style={s("font-size:17px;color:#FFB84D;font-variation-settings:'FILL' 1;flex:none")}>auto_awesome</span>
            {toast}
          </div>
        )}
        {rewardsOpen && (
          <CoinRewardsSheet
            wallet={wallet}
            busyReward={busyReward}
            onClose={() => setRewardsOpen(false)}
            onClaimDaily={handleClaimDaily}
            onClaimBonus={handleClaimBonus}
          />
        )}
        {isTabScreen && (
          <YoinkNav
            tab={flow.screen}
            onSelectTab={handleSelectTab}
            accent={TAB_ACCENTS[flow.screen]}
          />
        )}
      </IOSDevice>
    </div>
  );
}
