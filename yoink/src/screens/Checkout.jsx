import { useState } from 'react';
import { formatMoney, getCartQuantity, getCheckoutTotals, getPromoRate } from '../cart.js';
import { marketTheme } from '../marketTheme.js';
import { s } from '../style.js';

const { ink, wash, line, muted, brand, attentionBadgeBackground, attentionBadgeText } = marketTheme;

const checkoutOptions = {
  address: [
    {
      id: 'home',
      title: 'Byung Kim',
      subtitle: 'PO Box 1966, USAF Academy CO 80841',
      optionLabel: 'Home address - fastest checkout',
    },
    {
      id: 'locker',
      title: 'Campus locker',
      subtitle: 'Hold at USAF Academy pickup locker',
      optionLabel: 'Campus pickup locker',
    },
  ],
  shipping: [
    {
      id: 'standard',
      title: 'Yoink Standard - $3.00',
      subtitle: 'Arrives Sun, Jul 5',
      price: 3,
      optionLabel: 'Yoink Standard - $3.00',
    },
    {
      id: 'rush',
      title: 'Yoink Rush - $6.50',
      subtitle: 'Arrives Fri, Jul 3',
      price: 6.5,
      optionLabel: 'Yoink Rush - $6.50',
    },
  ],
  plan: [
    {
      id: 'pay-now',
      title: 'Pay now',
      subtitle: 'Pay the whole amount today',
      optionLabel: 'Pay now',
    },
    {
      id: 'hold',
      title: 'Hold for 15 minutes',
      subtitle: 'Reserve the cart while you decide',
      optionLabel: 'Hold for 15 minutes',
    },
  ],
  payment: [
    {
      id: 'apple-pay',
      title: 'Apple Pay',
      subtitle: 'Double-click to confirm',
      optionLabel: 'Apple Pay',
    },
    {
      id: 'yoink-wallet',
      title: 'Yoink Wallet',
      subtitle: 'Double-click to confirm',
      optionLabel: 'Yoink Wallet',
    },
    {
      id: 'visa',
      title: 'Visa ending 4242',
      subtitle: 'Double-click to confirm',
      optionLabel: 'Visa ending 4242',
    },
  ],
};

function OptionPill({ option, selected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      style={s(`width:100%;border:1.5px solid ${selected ? attentionBadgeBackground : '#DED7F0'};border-radius:12px;background:${selected ? attentionBadgeBackground : '#F4EFFF'};color:${attentionBadgeText};padding:11px 13px;text-align:left;font:900 12.5px/1.1 'Nunito';cursor:pointer;transition:background .16s ease,transform .16s ease,border-color .16s ease;box-shadow:${selected ? '0 2px 0 rgba(23,19,38,.08)' : 'none'}`)}
    >
      {option.optionLabel}
    </button>
  );
}

function CheckoutRow({ rowId, label, icon, title, subtitle, expanded, onToggle, options, selectedId, onSelect }) {
  return (
    <section style={s(`border-bottom:1.5px solid ${line}`)}>
      <button
        type="button"
        aria-controls={`checkout-${rowId}-options`}
        aria-expanded={expanded}
        onClick={onToggle}
        style={s("width:100%;display:grid;grid-template-columns:92px 1fr 22px;gap:10px;padding:16px 14px;align-items:start;border:0;background:transparent;text-align:left;cursor:pointer")}
      >
        <span style={s(`display:flex;align-items:center;gap:5px;font:800 12px 'Nunito';color:${muted}`)}>
          <span className="mi" style={s("font-size:17px")}>{icon}</span>
          {label}
        </span>
        <span style={s("min-width:0")}>
          <strong style={s(`display:block;font:900 15.5px/1.2 'Nunito';color:${ink}`)}>{title}</strong>
          <small style={s(`display:block;margin-top:4px;font:800 12.5px/1.35 'Nunito';color:${muted};white-space:normal`)}>{subtitle}</small>
        </span>
        <span className="mi" style={s(`font-size:21px;color:${ink};line-height:1`)}>
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {expanded ? (
        <div
          id={`checkout-${rowId}-options`}
          style={s("display:flex;flex-direction:column;gap:8px;padding:0 14px 16px 116px")}
        >
          {options.map((option) => (
            <OptionPill
              key={option.id}
              option={option}
              selected={option.id === selectedId}
              onSelect={() => onSelect(option.id)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function getSelectedOption(options, selectedId) {
  return options.find((option) => option.id === selectedId) ?? options[0];
}

function CartSummary({ cartItems, itemLabel }) {
  if (cartItems.length === 0) {
    return (
      <div style={s(`padding:22px 16px;border:1.5px dashed #DCD5EF;border-radius:18px;background:${wash};text-align:center`)}>
        <div style={s(`font:900 17px 'Fredoka';color:${ink}`)}>Your cart is empty</div>
        <div style={s(`margin-top:5px;font:700 12.5px 'Nunito';color:${muted}`)}>Add an item from the market to review it here.</div>
      </div>
    );
  }

  const firstItem = cartItems[0];
  const extraCount = cartItems.length - 1;
  const itemDescription = extraCount > 0
    ? `${itemLabel} - ${firstItem.imageLabel} + ${extraCount} more`
    : `${itemLabel} - ${firstItem.imageLabel}`;

  return (
    <div style={s("display:flex;align-items:center;gap:13px")}>
      <div style={s(`position:relative;width:58px;height:58px;border-radius:17px;background:${firstItem.imageStripe};border:1.5px solid #EEEAF8;overflow:hidden;flex:none;box-shadow:0 8px 18px rgba(106,90,205,.12)`)}>
        {firstItem.imageUrl ? (
          <img src={firstItem.imageUrl} alt={firstItem.title} style={s('width:100%;height:100%;object-fit:cover;display:block')} />
        ) : (
          <div style={s("position:absolute;left:50%;top:50%;width:27px;height:36px;border-radius:8px 8px 11px 11px;background:#fff;transform:translate(-50%,-55%);box-shadow:0 13px 0 -5px #FF9DB2")} />
        )}
        <span style={s(`position:absolute;right:-5px;top:-5px;min-width:23px;height:23px;border-radius:999px;background:${brand};border:2px solid #fff;color:#fff;display:flex;align-items:center;justify-content:center;font:900 11px 'Fredoka'`)}>
          {getCartQuantity(cartItems)}
        </span>
      </div>
      <div style={s("flex:1;min-width:0")}>
        <strong style={s(`display:block;font:900 18px/1.1 'Fredoka';color:${ink}`)}>Total</strong>
        <span style={s(`display:block;margin-top:4px;font:800 12.5px/1.25 'Nunito';color:${muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>
          {itemDescription}
        </span>
      </div>
    </div>
  );
}

function CartItemRow({ item }) {
  return (
    <div style={s("display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1.5px solid #EFECF6")}>
      <div style={s(`position:relative;width:54px;height:54px;border-radius:15px;background:${item.imageStripe};border:1.5px solid #EEEAF8;overflow:hidden;flex:none`)}>
        {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={s('width:100%;height:100%;object-fit:cover;display:block')} />}
        <span style={s(`position:absolute;right:-5px;top:-5px;min-width:23px;height:23px;border-radius:999px;background:${brand};border:2px solid #fff;color:#fff;display:flex;align-items:center;justify-content:center;font:900 11px 'Fredoka'`)}>
          {item.quantity}
        </span>
      </div>
      <div style={s("flex:1;min-width:0")}>
        <strong style={s(`display:block;font:800 13.5px/1.25 'Nunito';color:${ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>
          {item.title}
        </strong>
        <span style={s(`display:block;margin-top:2px;font:700 11.5px/1.25 'Nunito';color:${muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>
          {item.imageLabel} - {item.seller} {item.feedback}
        </span>
      </div>
      <div style={s(`font:900 13px 'Fredoka';color:${ink}`)}>{formatMoney(item.unitPrice * item.quantity)}</div>
    </div>
  );
}

export default function Checkout({ cartItems = [], balance = 0, onBack = () => {}, onPlaceOrder = null, onToast = () => {} }) {
  const [expandedRow, setExpandedRow] = useState({
    address: false,
    shipping: false,
    plan: false,
    payment: false,
  });
  const [selectedAddress, setSelectedAddress] = useState('home');
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [selectedPlan, setSelectedPlan] = useState('pay-now');
  const [selectedPayment, setSelectedPayment] = useState('visa');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState(null);
  const [promoError, setPromoError] = useState(false);

  const applyPromo = () => {
    if (getPromoRate(promoInput) > 0) {
      setPromoCode(promoInput.trim().toUpperCase());
      setPromoError(false);
      setPromoOpen(false);
    } else {
      setPromoError(true);
    }
  };

  const address = getSelectedOption(checkoutOptions.address, selectedAddress);
  const shippingChoice = getSelectedOption(checkoutOptions.shipping, selectedShipping);
  const plan = getSelectedOption(checkoutOptions.plan, selectedPlan);
  const payment = getSelectedOption(checkoutOptions.payment, selectedPayment);
  const { subtotal, shipping, discount, total } = getCheckoutTotals(cartItems, { shippingPrice: shippingChoice.price, promoCode });
  const itemCount = getCartQuantity(cartItems);
  const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;
  const toggleRow = (rowId) => {
    setExpandedRow((rows) => ({ ...rows, [rowId]: !rows[rowId] }));
  };

  const handleYoinkNow = async () => {
    if (!onPlaceOrder || cartItems.length === 0 || placing) return;
    setPlacing(true);
    setOrderError(null);
    try {
      const result = await onPlaceOrder({
        shippingPrice: shippingChoice.price,
        promoCode,
        shippingLabel: shippingChoice.optionLabel,
        addressLabel: address.title,
        paymentLabel: payment.title,
      });
      if (result && !result.ok) setOrderError(result);
    } catch {
      setOrderError({ error: 'Something snagged — try again' });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={s(`min-height:100%;background:#fff;display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:${ink}`)}>
      <div style={s("flex:1;overflow:auto;padding:50px 14px 126px")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:22px")}>
          <button
            type="button"
            aria-label="Close checkout"
            onClick={onBack}
            style={s("width:38px;height:38px;border:0;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0")}
          >
            <span className="mi" style={s(`font-size:31px;color:${ink}`)}>close</span>
          </button>
          <div style={s(`font:900 22px/1 'Fredoka';color:${ink}`)}>Checkout</div>
          <div style={s("width:38px")} />
        </div>

        <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;gap:12px")}>
          <div style={s(`font:900 24px 'Fredoka';color:${brand}`)}>Yoink!</div>
          <div style={s(`font:800 12.5px 'Nunito';color:${ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>
            kimbo9883@gmail.com
          </div>
        </div>

        <div style={s("border:1.5px solid #DDD8E8;border-radius:20px;background:#fff;overflow:hidden;box-shadow:0 10px 24px rgba(106,90,205,.06)")}>
          <CheckoutRow
            rowId="address"
            label="Ship to"
            icon="location_on"
            title={address.title}
            subtitle={address.subtitle}
            expanded={expandedRow.address}
            onToggle={() => toggleRow('address')}
            options={checkoutOptions.address}
            selectedId={selectedAddress}
            onSelect={setSelectedAddress}
          />
          <CheckoutRow
            rowId="shipping"
            label="Delivery"
            icon="local_shipping"
            title={shippingChoice.title}
            subtitle={shippingChoice.subtitle}
            expanded={expandedRow.shipping}
            onToggle={() => toggleRow('shipping')}
            options={checkoutOptions.shipping}
            selectedId={selectedShipping}
            onSelect={setSelectedShipping}
          />
          <CheckoutRow
            rowId="plan"
            label="Plan"
            icon="payments"
            title={plan.title}
            subtitle={plan.subtitle}
            expanded={expandedRow.plan}
            onToggle={() => toggleRow('plan')}
            options={checkoutOptions.plan}
            selectedId={selectedPlan}
            onSelect={setSelectedPlan}
          />
          <CheckoutRow
            rowId="payment"
            label="Payment"
            icon="credit_card"
            title={payment.title}
            subtitle={payment.subtitle}
            expanded={expandedRow.payment}
            onToggle={() => toggleRow('payment')}
            options={checkoutOptions.payment}
            selectedId={selectedPayment}
            onSelect={setSelectedPayment}
          />
        </div>

        {promoCode ? (
          <div style={s(`display:inline-flex;align-items:center;gap:7px;margin-top:22px;background:#DFF8F1;border:1.5px solid #9BE8D6;border-radius:999px;padding:10px 14px;color:#0B8576;font:900 13px 'Nunito';animation:ypop .35s ease both`)}>
            <span className="mi" style={s("font-size:18px;font-variation-settings:'FILL' 1")}>sell</span>
            {promoCode} applied — {formatMoney(discount)} off
            <button
              type="button"
              aria-label="Remove discount"
              onClick={() => { setPromoCode(null); setPromoInput(''); }}
              style={s("border:0;background:transparent;padding:0;display:inline-flex;cursor:pointer;color:#0B8576")}
            >
              <span className="mi" style={s("font-size:17px")}>close</span>
            </button>
          </div>
        ) : promoOpen ? (
          <div style={s("display:flex;align-items:center;gap:8px;margin-top:22px")}>
            <input
              autoFocus
              value={promoInput}
              onChange={(event) => { setPromoInput(event.target.value); setPromoError(false); }}
              onKeyDown={(event) => { if (event.key === 'Enter') applyPromo(); }}
              placeholder="Try YOINK10"
              style={s(`flex:1;height:44px;border:1.5px solid ${promoError ? '#FF6B3D' : '#DDD8E8'};border-radius:999px;padding:0 16px;font:800 13px 'Nunito';color:${ink};outline:none;background:${promoError ? '#FFF3EE' : '#fff'}`)}
            />
            <button
              type="button"
              onClick={applyPromo}
              style={s(`border:0;height:44px;padding:0 18px;border-radius:999px;background:${ink};color:#fff;font:900 13px 'Fredoka';cursor:pointer`)}
            >
              Apply
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPromoOpen(true)}
            style={s(`display:inline-flex;align-items:center;gap:7px;margin-top:22px;background:#fff;border:1.5px solid #DDD8E8;border-radius:999px;padding:10px 14px;color:${ink};font:900 13px 'Nunito';cursor:pointer`)}
          >
            <span className="mi" style={s("font-size:18px")}>sell</span>
            Add discount
          </button>
        )}

        <div style={s("margin-top:22px")}>
          <CartSummary cartItems={cartItems} itemLabel={itemLabel} />
        </div>

        <div style={s("margin-top:12px")}>
          {cartItems.map((item) => <CartItemRow key={item.id} item={item} />)}
        </div>

        <div style={s("margin-top:16px;display:flex;flex-direction:column;gap:8px")}>
          <div style={s(`display:flex;justify-content:space-between;font:800 13px 'Nunito';color:${muted}`)}>
            <span>Subtotal - {itemLabel}</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div style={s(`display:flex;justify-content:space-between;font:800 13px 'Nunito';color:${muted}`)}>
            <span>Shipping</span>
            <span>{formatMoney(shipping)}</span>
          </div>
          {discount > 0 && (
            <div style={s("display:flex;justify-content:space-between;font:800 13px 'Nunito';color:#0B8576")}>
              <span>Discount &middot; {promoCode}</span>
              <span>-{formatMoney(discount)}</span>
            </div>
          )}
          <div style={s(`display:flex;justify-content:space-between;align-items:center;margin-top:5px;font:900 19px 'Fredoka';color:${ink}`)}>
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>

        <div style={s(`display:flex;flex-wrap:wrap;gap:9px 16px;margin-top:54px;padding-top:22px;border-top:1.5px solid #EFECF6`)}>
          {['Refund policy', 'Shipping', 'Privacy policy', 'Terms of service', 'Cancellations'].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onToast('It’s all pretend — no fine print, no real money!')}
              style={s(`border:0;background:transparent;padding:0;font:800 13px/1.45 'Nunito';color:${brand};cursor:pointer`)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={s("position:sticky;bottom:0;background:#fff;padding:12px 14px 24px;box-shadow:0 -4px 16px rgba(23,19,38,.08)")}>
        {orderError && (
          <div role="alert" style={s("display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:10px 13px;border-radius:13px;background:#FFEDE5;border:1.5px solid #FFC2A8;animation:ypop .35s ease both")}>
            <span className="mi" style={s("font-size:19px;color:#D2491F")}>sentiment_dissatisfied</span>
            <span style={s("flex:1;font:800 12.5px 'Nunito';color:#B23A15")}>
              {orderError.error}{orderError.shortBy ? ` — you're ${formatMoney(orderError.shortBy)} short. Claim your daily coins!` : ''}
            </span>
          </div>
        )}
        <div style={s(`display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font:800 12.5px 'Nunito';color:${muted}`)}>
          <span>Yoink Wallet</span>
          <span style={s("display:inline-flex;align-items:center;gap:5px")}>
            <span style={s(`width:16px;height:16px;border-radius:50%;background:${brand};display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:#fff`)}>Y</span>
            <span style={s(`font:900 13px 'Fredoka';color:${total > balance ? '#D2491F' : ink}`)}>{balance.toLocaleString()}</span>
          </span>
        </div>
        <button
          type="button"
          disabled={cartItems.length === 0 || placing}
          onClick={handleYoinkNow}
          style={s(`width:100%;height:58px;border:0;border-radius:999px;background:${cartItems.length === 0 ? '#CFC8DD' : brand};color:#fff;display:flex;align-items:center;justify-content:center;gap:22px;font:900 17px 'Fredoka';box-shadow:${cartItems.length === 0 ? 'none' : '0 5px 0 #4B3BA6'};cursor:${cartItems.length === 0 || placing ? 'default' : 'pointer'};${placing ? 'opacity:.75' : ''}`)}
        >
          <span>{placing ? 'Yoinking…' : 'Yoink it now'}</span>
          <span style={s("width:1.5px;height:26px;background:rgba(255,255,255,.55)")} />
          <span>{formatMoney(total)}</span>
        </button>
      </div>
    </div>
  );
}
