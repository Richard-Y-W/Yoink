import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { s } from './style.js';
import { scrollToScreenTop } from './appScroll.js';
import IOSDevice from './components/IOSDevice.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import OrderYoinked from './components/OrderYoinked.jsx';
import YoinkNav from './components/YoinkNav.jsx';
import { addListingToCart, getCartQuantity } from './cart.js';
import { fetchOrders, fetchWallet, placeOrder } from './api.js';
import Account from './screens/Account.jsx';
import Checkout from './screens/Checkout.jsx';
import MonoMarket from './screens/MonoMarket.jsx';
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
  [APP_SCREENS.watching]: '#6A5ACD',
  [APP_SCREENS.account]: '#6A5ACD',
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
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const screenRootRef = useRef(null);
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

  const isTabScreen = TAB_SCREENS.includes(flow.screen);
  const isProductDetail = flow.screen === APP_SCREENS.productDetail;
  const isCheckout = flow.screen === APP_SCREENS.checkout;
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
    <div ref={screenRootRef} style={s("min-height:100vh;padding:28px 24px 46px;box-sizing:border-box;display:flex;align-items:flex-start;justify-content:center")}>
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
        ) : flow.screen === APP_SCREENS.watching ? (
          <Watching
            balance={wallet.balance}
            cartCount={cartCount}
            onOpenCart={handleOpenCart}
          />
        ) : flow.screen === APP_SCREENS.account ? (
          <Account
            balance={wallet.balance}
            streak={wallet.streak}
            ordersInFlight={ordersInFlight}
            cartCount={cartCount}
            onOpenCart={handleOpenCart}
          />
        ) : (
          <MonoMarket
            onOpenProduct={(listing, trigger) => setFlow(openProductDetail(listing, trigger))}
            onOpenCart={handleOpenCart}
            cartCount={cartCount}
            balance={wallet.balance}
            artStyle={artStyle}
            onCycleArtStyle={cycleArtStyle}
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
          />
        )}
      </IOSDevice>
    </div>
  );
}
