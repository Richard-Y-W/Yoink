import { useCallback, useEffect, useRef, useState } from 'react';
import { s } from './style.js';
import IOSDevice from './components/IOSDevice.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import OrderYoinked from './components/OrderYoinked.jsx';
import YoinkNav from './components/YoinkNav.jsx';
import { addListingToCart, getCartQuantity } from './cart.js';
import { fetchOrders, fetchWallet, placeOrder } from './api.js';
import Checkout from './screens/Checkout.jsx';
import Drops from './screens/Drops.jsx';
import MonoMarket from './screens/MonoMarket.jsx';
import Orders from './screens/Orders.jsx';
import Pocket from './screens/Pocket.jsx';
import ProductDetail from './screens/ProductDetail.jsx';
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
  [APP_SCREENS.market]: '#6A5ACD',
  [APP_SCREENS.drops]: '#8B5CF6',
  [APP_SCREENS.pocket]: '#10B5A0',
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
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const handleSell = useCallback(() => {
    showToast('Selling opens soon — keep collecting!');
  }, [showToast]);

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
    return () => window.clearInterval(timer);
  }, [refreshWallet, refreshOrdersBadge]);

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
          />
        ) : flow.screen === APP_SCREENS.drops ? (
          <Drops
            balance={wallet.balance}
            streak={wallet.streak}
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
            canClaim={wallet.canClaim}
            onWallet={setWallet}
            cartCount={cartCount}
            onAddToCart={addToCart}
            onOpenCart={handleOpenCart}
            onToast={showToast}
          />
        ) : flow.screen === APP_SCREENS.orders ? (
          <Orders balance={wallet.balance} celebrateOrderId={flow.celebrateOrderId ?? null} />
        ) : (
          <MonoMarket
            onOpenProduct={(listing, trigger) => setFlow(openProductDetail(listing, trigger))}
            onOpenCart={handleOpenCart}
            cartCount={cartCount}
            balance={wallet.balance}
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
            onSell={handleSell}
          />
        )}
      </IOSDevice>
    </div>
  );
}
