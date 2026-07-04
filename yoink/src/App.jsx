import { useCallback, useEffect, useRef, useState } from 'react';
import { s } from './style.js';
import IOSDevice from './components/IOSDevice.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import OrderYoinked from './components/OrderYoinked.jsx';
import YoinkNav from './components/YoinkNav.jsx';
import { addListingToCart, getCartQuantity } from './cart.js';
import { fetchBell, fetchOrders, fetchWallet, placeOrder } from './api.js';
import { bellLabel } from './bellView.js';
import Checkout from './screens/Checkout.jsx';
import Exchange from './screens/Exchange.jsx';
import Quests from './screens/Quests.jsx';
import MonoMarket from './screens/MonoMarket.jsx';
import Orders from './screens/Orders.jsx';
import Pocket from './screens/Pocket.jsx';
import ProductDetail from './screens/ProductDetail.jsx';
import { ART_STYLES } from './itemArt.js';
import {
  APP_SCREENS,
  TAB_SCREENS,
  closeExchange,
  getInitialScreen,
  openCheckout,
  openExchange,
  openOrders,
  openProductDetail,
  openTab,
  returnFromCheckout,
  returnToMarket,
} from './appFlow.js';

const TAB_ACCENTS = {
  [APP_SCREENS.market]: '#6A5ACD',
  [APP_SCREENS.quests]: '#6A5ACD',
  [APP_SCREENS.pocket]: '#6A5ACD',
  [APP_SCREENS.orders]: '#6A5ACD',
};

export default function App() {
  const [flow, setFlow] = useState(() => ({
    screen: getInitialScreen(),
    selectedListing: null,
  }));
  const [cartItems, setCartItems] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, streak: 0, canClaim: false, canSpin: false });
  const [yoinkedOrder, setYoinkedOrder] = useState(null);
  const [ordersInFlight, setOrdersInFlight] = useState(0);
  const [bellStatus, setBellStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
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

  const handleExchange = useCallback(() => {
    setFlow((current) => (current.screen === APP_SCREENS.exchange ? closeExchange(current) : openExchange(current)));
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

  // Ambient bell status for the shop header chip: live now, or the next
  // bell's time. Light 30s poll — the Exchange screen has its own.
  const refreshBellStatus = useCallback(() => {
    fetchBell().then((data) => {
      if (!data?.next) return;
      setBellStatus(data.live
        ? { live: true, label: 'LIVE' }
        : { live: false, label: bellLabel(data.next.startsAt) });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    refreshWallet();
    refreshOrdersBadge();
    refreshBellStatus();
    const timer = window.setInterval(refreshOrdersBadge, 5000);
    const bellTimer = window.setInterval(refreshBellStatus, 30000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(bellTimer);
    };
  }, [refreshWallet, refreshOrdersBadge, refreshBellStatus]);

  const isTabScreen = TAB_SCREENS.includes(flow.screen);
  const isProductDetail = flow.screen === APP_SCREENS.productDetail;
  const isCheckout = flow.screen === APP_SCREENS.checkout;
  const isExchange = flow.screen === APP_SCREENS.exchange;
  const cartCount = getCartQuantity(cartItems);
  const addToCart = (listing, quantity = 1) => setCartItems((current) => addListingToCart(current, listing, quantity));
  const handleOpenCart = () => setFlow((current) => openCheckout(current));
  const handleCloseCheckout = () => setFlow((current) => returnFromCheckout(current));
  const handleSelectTab = (tab) => setFlow((current) => openTab(current, tab));

  const handlePlaceOrder = async (options) => {
    const result = await placeOrder({ items: cartItems, ...options });
    if (result.ok) {
      if (result.wallet) setWallet(result.wallet);
      setYoinkedOrder(result.order);
    }
    return result;
  };

  const handleYoinkDone = useCallback(() => {
    setYoinkedOrder((order) => {
      if (order) setFlow(openOrders(order.id));
      return null;
    });
    setCartItems([]);
    refreshOrdersBadge();
  }, [refreshOrdersBadge]);

  return (
    <div style={s("min-height:100vh;padding:28px 24px 46px;box-sizing:border-box;display:flex;align-items:flex-start;justify-content:center")}>
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
          />
        ) : isExchange ? (
          <Exchange
            balance={wallet.balance}
            onWallet={setWallet}
            onToast={showToast}
            onBack={handleExchange}
          />
        ) : flow.screen === APP_SCREENS.quests ? (
          <Quests
            balance={wallet.balance}
            streak={wallet.streak}
            canClaim={wallet.canClaim}
            canSpin={wallet.canSpin}
            onWallet={setWallet}
            cartCount={cartCount}
            onOpenCart={handleOpenCart}
            onToast={showToast}
          />
        ) : flow.screen === APP_SCREENS.pocket ? (
          <Pocket
            balance={wallet.balance}
            streak={wallet.streak}
            cartCount={cartCount}
            onAddToCart={addToCart}
            onOpenCart={handleOpenCart}
            onToast={showToast}
            artStyle={artStyle}
          />
        ) : flow.screen === APP_SCREENS.orders ? (
          <Orders balance={wallet.balance} celebrateOrderId={flow.celebrateOrderId ?? null} />
        ) : (
          <MonoMarket
            onOpenProduct={(listing, trigger) => setFlow(openProductDetail(listing, trigger))}
            onOpenCart={handleOpenCart}
            cartCount={cartCount}
            balance={wallet.balance}
            artStyle={artStyle}
            onCycleArtStyle={cycleArtStyle}
            bell={bellStatus}
            onBellTap={handleExchange}
          />
        )}
        {toast && (
          <div style={s("position:absolute;left:50%;bottom:112px;transform:translateX(-50%);z-index:940;display:flex;align-items:center;gap:9px;max-width:86%;background:#171326;color:#fff;padding:10px 16px;border-radius:999px;box-shadow:0 10px 24px rgba(23,19,38,.35);font:700 12.5px 'Fredoka';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:ypop .35s ease both")}>
            <span className="mi" style={s("font-size:17px;color:#FFB84D;font-variation-settings:'FILL' 1;flex:none")}>auto_awesome</span>
            {toast}
          </div>
        )}
        {isTabScreen && (
          <YoinkNav
            tab={flow.screen}
            onSelectTab={handleSelectTab}
            accent={TAB_ACCENTS[flow.screen]}
            ordersInFlight={ordersInFlight}
            onExchange={handleExchange}
          />
        )}
      </IOSDevice>
    </div>
  );
}
