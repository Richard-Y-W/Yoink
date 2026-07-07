import { useMemo, useRef, useState } from 'react';
import { s } from '../style.js';
import { makeProductDetail, makeStarRow } from '../productDetailData.js';
import { marketTheme } from '../marketTheme.js';
import AddToCartMotion from '../components/AddToCartMotion.jsx';
import ItemArt from '../components/ItemArt.jsx';
import Mochi from '../components/Mochi.jsx';
import { artStageBackground, resolveArtKind } from '../itemArt.js';

const { ink, wash, line, muted, brand, attentionBadgeBackground, attentionBadgeText } = marketTheme;

function IconButton({ icon, onClick, filled = false, color = ink, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={s("width:38px;height:38px;border:0;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(23,19,38,.16);cursor:pointer;padding:0")}
    >
      <span className="mi" style={s(`font-size:21px;color:${color};${filled ? "font-variation-settings:'FILL' 1" : ''}`)}>{icon}</span>
    </button>
  );
}

function StarRow({ rating = 4 }) {
  return (
    <div style={s("display:flex;gap:1px")}>
      {makeStarRow(rating).map((star) => (
        <span key={star.id} className="mi" style={s(`font-size:13px;color:${star.color};font-variation-settings:'FILL' 1`)}>
          star
        </span>
      ))}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={s(`font:700 18px 'Fredoka';color:${ink};margin:26px 0 9px`)}>{children}</div>;
}

const POLICY_DETAILS = {
  'Return policy': 'Changed your mind? Send it back within 30 pretend days for a full coin refund.',
  'Shipping policy': 'Yoink express: packed in 30 seconds, delivered in about 4 minutes. Watch it in Orders.',
};

export default function ProductDetail({
  listing,
  onBack,
  cartCount = 0,
  onAddToCart = () => {},
  onOpenCart = () => {},
  onToast = () => {},
  artStyle = 'vinyl',
  isWatched = false,
  onToggleWatchedListing = () => {},
}) {
  const detail = useMemo(() => makeProductDetail(listing), [listing]);
  const artKind = useMemo(() => resolveArtKind(listing) ?? resolveArtKind(detail), [listing, detail]);
  const [spinDeg, setSpinDeg] = useState(null);
  const dragRef = useRef(null);
  const canSpin = artKind && artStyle === 'spin';

  const spinHandlers = canSpin ? {
    onPointerDown: (event) => {
      dragRef.current = { startX: event.clientX, base: spinDeg ?? 0 };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event) => {
      if (!dragRef.current) return;
      setSpinDeg(dragRef.current.base + (event.clientX - dragRef.current.startX) * 0.55);
    },
    onPointerUp: () => { dragRef.current = null; },
    onPointerCancel: () => { dragRef.current = null; },
  } : {};
  const [qty, setQty] = useState(1);
  const [cartMotionKey, setCartMotionKey] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [activeDot, setActiveDot] = useState(0);
  const [shipToLocker, setShipToLocker] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(null);
  const reviewsRef = useRef(null);

  const voteHelpful = (reviewId) => {
    setHelpfulVotes((votes) => ({ ...votes, [reviewId]: !votes[reviewId] }));
  };
  const visibleReviews = reviewsExpanded ? detail.reviews : detail.reviews.slice(0, 2);

  const shareItem = () => {
    const link = `yoink.app/find/${listing?.id ?? 'walkman'}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).catch(() => {});
    onToast('Link copied — go brag about this find!');
  };

  const scrollToReviews = () => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const togglePolicyRow = (label) => {
    if (label.startsWith('Visit')) {
      onToast(`${detail.seller} waves hello — storefronts open soon!`);
      return;
    }
    setOpenPolicy((current) => (current === label ? null : label));
  };

  const incQty = () => setQty((current) => Math.min(current + 1, detail.quantityAvailable));
  const decQty = () => setQty((current) => Math.max(current - 1, 1));
  const primaryAddsToCart = detail.primaryCta === 'Add to cart';
  const secondaryAddsToCart = detail.secondaryCta === 'Add to cart';
  const playCartMotion = () => {
    onAddToCart(qty);
    setCartMotionKey((current) => current + 1);
  };
  const buyNow = () => {
    onAddToCart(qty);
    onOpenCart();
  };
  const bidOrOffer = () => {
    onToast('This listing is direct-buy only right now.');
  };
  const handlePrimary = primaryAddsToCart ? playCartMotion : bidOrOffer;
  const handleSecondary = secondaryAddsToCart ? playCartMotion : buyNow;

  return (
    <div style={s(`position:relative;min-height:100%;overflow:hidden;background:#fff;display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:${ink}`)}>
      <AddToCartMotion playKey={cartMotionKey} cartCount={cartCount} />
      <div style={s("position:relative;height:336px;flex:none;border-radius:0 0 26px 26px;overflow:hidden")}>
        {detail.imageUrl ? (
          <div style={s(`position:absolute;inset:0;background:${detail.imageStripe};display:flex;align-items:center;justify-content:center;filter:hue-rotate(${activeDot * 8}deg);transition:filter .35s ease`)}>
            <img src={detail.imageUrl} alt={detail.title} style={s('width:100%;height:100%;object-fit:contain;display:block;padding:22px;box-sizing:border-box')} />
          </div>
        ) : artKind ? (
          <div
            {...spinHandlers}
            style={s(`position:absolute;inset:0;background:${artStageBackground(artStyle, artKind)};display:flex;align-items:center;justify-content:center;filter:hue-rotate(${activeDot * 28}deg);transition:filter .35s ease;${canSpin ? 'cursor:grab;touch-action:pan-y' : ''}`)}
          >
            <ItemArt kind={artKind} artStyle={artStyle} width={252} animate spinDeg={spinDeg} />
            {canSpin && (
              <div style={s("position:absolute;bottom:44px;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);font:700 10px 'Nunito';color:#EDEAF6;letter-spacing:.5px;white-space:nowrap;pointer-events:none")}>
                DRAG TO SPIN · 360°
              </div>
            )}
          </div>
        ) : (
          <div style={s(`position:absolute;inset:0;background:${detail.imageStripe};filter:hue-rotate(${activeDot * 28}deg);transition:filter .35s ease`)} />
        )}
        <div style={s("position:absolute;top:0;left:0;height:100%;width:34%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);animation:yshine 4s ease-in-out infinite;pointer-events:none")} />
        <div style={s("position:absolute;top:52px;left:14px")}>
          <IconButton icon="arrow_back" label="Back to market" onClick={onBack} />
        </div>
        <div style={s("position:absolute;top:52px;right:14px;display:flex;gap:8px")}>
          <IconButton
            icon="favorite"
            label={isWatched ? 'Remove from watching' : 'Watch item'}
            onClick={() => onToggleWatchedListing(listing)}
            filled={isWatched}
            color={isWatched ? '#FF3D9A' : ink}
          />
          <div style={s("position:relative")}>
            <IconButton icon="shopping_cart" label="Open cart" onClick={onOpenCart} />
            <span style={s(`position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:${brand};color:#fff;font:700 9.5px 'Fredoka';display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff`)}>
              {cartCount}
            </span>
          </div>
          <IconButton icon="share" label="Share item" onClick={shareItem} />
        </div>
        <div style={s(`position:absolute;top:54px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:5px 12px 5px 9px;border-radius:999px;background:${attentionBadgeBackground};font:700 11px 'Fredoka';color:${attentionBadgeText};box-shadow:0 3px 10px rgba(23,19,38,.14)`)}>
          <span className="mi" style={s("font-size:14px;font-variation-settings:'FILL' 1")}>bolt</span>
          RARE FIND
        </div>
        <div style={s("position:absolute;bottom:15px;left:50%;transform:translateX(-50%);display:flex;gap:6px")}>
          {detail.dots.map((dot, index) => (
            <button
              key={dot.id}
              type="button"
              aria-label={`Photo ${index + 1}`}
              onClick={() => setActiveDot(index)}
              style={s(`width:${index === activeDot ? 14 : 6}px;height:6px;border:0;padding:0;border-radius:99px;background:${index === activeDot ? '#171326' : '#CFC8DD'};cursor:pointer;transition:width .25s ease,background .25s ease`)}
            />
          ))}
        </div>
      </div>

      <div style={s("padding:16px 16px 46px;display:flex;flex-direction:column")}>
        <div style={s(`font:700 22px 'Fredoka';color:${ink};line-height:1.15`)}>{detail.title}</div>

        <div style={s("display:flex;align-items:center;gap:12px;margin-top:9px;flex-wrap:wrap")}>
          <div style={s("display:flex;align-items:center;gap:5px")}>
            <span className="mi" style={s(`font-size:17px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>local_fire_department</span>
            <span style={s(`font:700 12.5px 'Nunito';color:${ink}`)}>{detail.socialProof}</span>
          </div>
          <div style={s("display:flex;align-items:center;gap:5px")}>
            <span style={s(`width:8px;height:8px;border-radius:50%;background:${brand};animation:ydot 1.4s infinite`)} />
            <span style={s(`font:700 12.5px 'Nunito';color:${brand}`)}>{detail.eyeing} eyeing now</span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Jump to reviews"
          onClick={scrollToReviews}
          style={s("display:flex;align-items:center;gap:7px;margin-top:10px;border:0;background:transparent;padding:0;cursor:pointer")}
        >
          <div style={s("display:flex;gap:1px")}>
            <span className="mi" style={s(`font-size:16px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>star</span>
            <span className="mi" style={s(`font-size:16px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>star</span>
            <span className="mi" style={s(`font-size:16px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>star</span>
            <span className="mi" style={s(`font-size:16px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>star</span>
            <span className="mi" style={s(`font-size:16px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>star_half</span>
          </div>
          <span style={s(`font:700 13px 'Nunito';color:${ink}`)}>{detail.ratingCount} ratings</span>
          <span className="mi" style={s(`font-size:16px;color:${muted}`)}>chevron_right</span>
        </button>

        <div style={s("display:flex;align-items:center;gap:8px;margin-top:15px")}>
          <span style={s(`width:22px;height:22px;border-radius:50%;background:${brand};display:inline-flex;align-items:center;justify-content:center;font:700 12px 'Fredoka';color:#fff;flex:none`)}>
            Y
          </span>
          <span style={s(`font:700 27px 'Fredoka';color:${ink}`)}>{detail.salePrice}</span>
          <span style={s("font:600 15px 'Nunito';color:#AFA9BC;text-decoration:line-through")}>{detail.originalPrice}</span>
          <span style={s(`padding:3px 9px;border-radius:8px;background:${attentionBadgeBackground};font:700 11.5px 'Fredoka';color:${attentionBadgeText}`)}>
            {detail.discount}
          </span>
        </div>

        <div style={s(`display:flex;align-items:center;gap:9px;margin-top:13px;padding:11px 13px;border-radius:14px;background:${wash};border:1.5px dashed #C9BEF0`)}>
          <span style={s(`width:24px;height:24px;border-radius:50%;background:${brand};display:inline-flex;align-items:center;justify-content:center;font:700 12px 'Fredoka';color:#fff;flex:none`)}>
            Y
          </span>
          <div style={s(`font:700 13.5px 'Nunito';color:${ink}`)}>
            Earn <span style={s(`color:${brand}`)}>{detail.coinBack}</span> back on this order
          </div>
        </div>

        <div style={s(`margin-top:13px;padding:13px 14px;border-radius:16px;background:${ink}`)}>
          <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;gap:10px")}>
            <div style={s("display:flex;align-items:center;gap:6px")}>
              <span className="mi" style={s(`font-size:18px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>bolt</span>
              <span style={s("font:700 13px 'Fredoka';color:#fff")}>{detail.scarcity}</span>
            </div>
            <div style={s("display:flex;align-items:center;gap:5px")}>
              <span className="mi" style={s(`font-size:15px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>timer</span>
              <span style={s(`font:700 13px 'Fredoka';color:${attentionBadgeBackground};font-variant-numeric:tabular-nums`)}>{detail.dealEnds}</span>
            </div>
          </div>
          <div style={s("height:7px;border-radius:99px;background:rgba(255,255,255,.16);overflow:hidden")}>
            <div style={s(`height:100%;width:18%;background:${attentionBadgeBackground};border-radius:99px`)} />
          </div>
        </div>

        <div style={s("display:flex;justify-content:flex-start;margin-top:16px")}>
          <Mochi color={brand} say="Rare one - I'd yoink it fast!" size={52} />
        </div>

        <div style={s(`font:700 14px 'Fredoka';color:${ink};margin:18px 0 9px`)}>Quantity</div>
        <div style={s(`display:flex;align-items:center;background:${wash};border:1.5px solid ${line};border-radius:14px;width:fit-content;overflow:hidden`)}>
          <button type="button" onClick={decQty} style={s("width:46px;height:46px;border:0;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer")}>
            <span className="mi" style={s(`font-size:22px;color:${ink}`)}>remove</span>
          </button>
          <span style={s(`min-width:34px;text-align:center;font:700 16px 'Fredoka';color:${ink}`)}>{qty}</span>
          <button type="button" onClick={incQty} style={s("width:46px;height:46px;border:0;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer")}>
            <span className="mi" style={s(`font-size:22px;color:${ink}`)}>add</span>
          </button>
        </div>

        <button type="button" onClick={handlePrimary} style={s(`display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px;background:${brand};color:#fff;font:700 16px 'Fredoka';padding:16px;border:0;border-radius:16px;box-shadow:0 5px 0 #4B3BA6;cursor:pointer`)}>
          <span className="mi" style={s("font-size:20px")}>add_shopping_cart</span>
          {detail.primaryCta}
        </button>
        <button type="button" onClick={handleSecondary} style={s(`display:flex;align-items:center;justify-content:center;gap:8px;margin-top:13px;background:${ink};color:#fff;font:700 16px 'Fredoka';padding:16px;border:0;border-radius:16px;box-shadow:0 5px 0 #000;cursor:pointer`)}>
          <span className="mi" style={s("font-size:20px;font-variation-settings:'FILL' 1")}>bolt</span>
          {detail.secondaryCta}
        </button>

        <SectionTitle>Description</SectionTitle>
        <div style={s(`font:600 13.5px/1.55 'Nunito';color:#3A3540;${descExpanded ? '' : 'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden'}`)}>
          {detail.description}
        </div>
        <button
          type="button"
          onClick={() => setDescExpanded((current) => !current)}
          style={s(`border:0;background:transparent;padding:0;text-align:left;font:700 13.5px 'Nunito';color:${brand};margin-top:4px;cursor:pointer`)}
        >
          {descExpanded ? 'Show less' : 'Read more'}
        </button>

        <div ref={reviewsRef} style={s("margin-top:22px")}>
          <div style={s("display:flex;align-items:center;justify-content:space-between")}>
            <div style={s(`font:700 18px 'Fredoka';color:${ink}`)}>Reviews</div>
            <div style={s("display:flex;align-items:center;gap:5px")}>
              <span style={s(`font:700 16px 'Fredoka';color:${ink}`)}>{detail.rating}</span>
              <span className="mi" style={s(`font-size:16px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>star</span>
              <span style={s("font:600 12.5px 'Nunito';color:#7A7686")}>(290)</span>
            </div>
          </div>
          <div style={s("display:flex;flex-wrap:wrap;gap:8px;margin-top:12px")}>
            {detail.reviewHighlights.map((highlight) => (
              <div key={highlight.label} style={s(`display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:${wash};border:1.5px solid #EAE5F6`)}>
                <span style={s(`font:700 12px 'Nunito';color:${ink}`)}>{highlight.label}</span>
                <span style={s(`font:700 11px 'Fredoka';color:${brand}`)}>{highlight.count}</span>
              </div>
            ))}
          </div>
          <div style={s("display:flex;flex-direction:column;margin-top:6px")}>
            {visibleReviews.map((review) => (
              <div key={review.id} style={s("padding:15px 0;border-bottom:1.5px solid #EFECF6")}>
                <div style={s("display:flex;align-items:center;gap:9px")}>
                  <div style={s(`width:32px;height:32px;border-radius:50%;background:${review.avatar};display:flex;align-items:center;justify-content:center;font:700 12px 'Fredoka';color:#fff;flex:none`)}>
                    {review.initial}
                  </div>
                  <div style={s("flex:1;min-width:0")}>
                    <div style={s("display:flex;align-items:center;gap:6px")}>
                      <span style={s(`font:700 13px 'Nunito';color:${ink}`)}>{review.name}</span>
                      <span style={s(`display:inline-flex;align-items:center;gap:2px;font:700 9px 'Nunito';color:${brand}`)}>
                        <span className="mi" style={s("font-size:12px;font-variation-settings:'FILL' 1")}>verified</span>
                        Yoinked
                      </span>
                    </div>
                    <div style={s("font:600 11px 'Nunito';color:#9C97A8")}>{review.ago}</div>
                  </div>
                  <StarRow rating={review.rating} />
                </div>
                <div style={s("font:600 13px/1.5 'Nunito';color:#2A2533;margin-top:9px")}>{review.text}</div>
                <button
                  type="button"
                  aria-pressed={Boolean(helpfulVotes[review.id])}
                  onClick={() => voteHelpful(review.id)}
                  style={s(`display:inline-flex;align-items:center;gap:6px;margin-top:11px;padding:6px 13px;border-radius:999px;border:1.5px solid ${helpfulVotes[review.id] ? brand : line};background:${helpfulVotes[review.id] ? wash : '#fff'};font:700 11.5px 'Nunito';color:${helpfulVotes[review.id] ? brand : '#5A5566'};cursor:pointer`)}
                >
                  <span className="mi" style={s(`font-size:15px;${helpfulVotes[review.id] ? "font-variation-settings:'FILL' 1" : ''}`)}>thumb_up</span>
                  Helpful &middot; {review.helpful + (helpfulVotes[review.id] ? 1 : 0)}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setReviewsExpanded((current) => !current)}
            style={s(`display:flex;align-items:center;justify-content:center;gap:6px;margin-top:16px;width:100%;background:#fff;border:2px solid ${ink};color:${ink};font:700 14px 'Fredoka';padding:13px;border-radius:14px;box-shadow:0 4px 0 ${ink};cursor:pointer`)}
          >
            {reviewsExpanded ? 'Show fewer reviews' : `Read all ${detail.reviews.length} reviews`}
            <span className="mi" style={s("font-size:18px")}>{reviewsExpanded ? 'expand_less' : 'chevron_right'}</span>
          </button>
        </div>

        <div style={s("margin-top:24px")}>
          <div style={s(`font:700 18px 'Fredoka';color:${ink};margin-bottom:13px`)}>Delivery &amp; Returns</div>
          <div style={s("display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px")}>
            {detail.deliveryBenefits.map((benefit) => (
              <div key={benefit.label} style={s(`background:${wash};border-radius:16px;padding:14px 8px;text-align:center`)}>
                <span className="mi" style={s(`font-size:25px;color:${brand};${benefit.filled ? "font-variation-settings:'FILL' 1" : ''}`)}>{benefit.icon}</span>
                <div style={s(`font:700 11px 'Nunito';color:${ink};margin-top:6px;line-height:1.25`)}>{benefit.label}</div>
              </div>
            ))}
          </div>
          <div style={s(`display:flex;align-items:center;gap:12px;margin-top:11px;padding:14px 15px;border-radius:16px;background:${ink}`)}>
            <span className="mi" style={s(`font-size:25px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>local_shipping</span>
            <div style={s("flex:1")}>
              <div style={s("font:700 14px 'Fredoka';color:#fff")}>{detail.deliveryEstimate}</div>
              <div style={s("font:600 11px 'Nunito';color:rgba(255,255,255,.6)")}>{shipToLocker ? 'Hold at campus locker' : detail.shipTo}</div>
            </div>
            <button
              type="button"
              onClick={() => setShipToLocker((current) => !current)}
              style={s(`border:0;background:transparent;padding:0;font:700 12px 'Nunito';color:${attentionBadgeBackground};cursor:pointer`)}
            >
              Change
            </button>
          </div>
          <div style={s(`margin-top:11px;border:1.5px solid #EDEAF6;border-radius:16px;overflow:hidden`)}>
            {detail.policyRows.map((row, index) => (
              <div key={row.label} style={s(`${index < detail.policyRows.length - 1 ? 'border-bottom:1.5px solid #EFECF6' : ''}`)}>
                <button
                  type="button"
                  aria-expanded={openPolicy === row.label}
                  onClick={() => togglePolicyRow(row.label)}
                  style={s("width:100%;display:flex;align-items:center;gap:12px;padding:14px 15px;border:0;background:transparent;text-align:left;cursor:pointer")}
                >
                  <span className="mi" style={s(`font-size:20px;color:${row.accent}`)}>{row.icon}</span>
                  <span style={s(`flex:1;font:700 13px 'Nunito';color:${ink}`)}>{row.label}</span>
                  <span className="mi" style={s(`font-size:20px;color:${muted}`)}>{openPolicy === row.label ? 'expand_less' : 'chevron_right'}</span>
                </button>
                {openPolicy === row.label && POLICY_DETAILS[row.label] && (
                  <div style={s(`padding:0 15px 14px 47px;font:600 12.5px/1.5 'Nunito';color:#5A5566;animation:ypop .25s ease both`)}>
                    {POLICY_DETAILS[row.label]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
