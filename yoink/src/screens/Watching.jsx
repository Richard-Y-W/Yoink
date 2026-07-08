import { s } from '../style.js';
import { marketTheme } from '../marketTheme.js';
import ItemArt from '../components/ItemArt.jsx';
import { artStageBackground, resolveArtKind } from '../itemArt.js';

const { ink, wash, line, muted, brand, attentionBadgeBackground, attentionBadgeText } = marketTheme;

function WatchedCard({ item, onOpenProduct, onToggleWatchedListing, artStyle = 'vinyl' }) {
  const artKind = resolveArtKind(item);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenProduct(item, 'listing')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenProduct(item, 'listing');
        }
      }}
      style={s("position:relative;background:#fff;border:1.5px solid #EDEAF6;border-radius:8px;overflow:hidden;box-shadow:0 5px 14px rgba(106,90,205,.10);cursor:pointer")}
    >
      <div style={s(`height:118px;background:${item.imageUrl ? '#fff' : artKind ? artStageBackground(artStyle, artKind) : item.stripe};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden`)}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} style={s('width:100%;height:100%;object-fit:cover;display:block')} />
        ) : artKind && <ItemArt kind={artKind} artStyle={artStyle} width={108} />}
        <button
          type="button"
          aria-label={`Remove ${item.name} from watching`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleWatchedListing(item);
          }}
          style={s("position:absolute;top:8px;right:8px;width:32px;height:32px;border:0;border-radius:50%;background:#FFE4F1;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 9px rgba(23,19,38,.16);cursor:pointer;padding:0;animation:ypop .28s ease both")}
        >
          <span className="mi" style={s("font-size:18px;color:#FF3D9A;font-variation-settings:'FILL' 1")}>favorite</span>
        </button>
      </div>
      <div style={s("padding:10px 11px 12px")}>
        <div style={s(`font:800 13px/1.25 'Nunito';color:${ink};height:33px;overflow:hidden`)}>
          {item.name}
        </div>
        <div style={s("display:flex;align-items:center;gap:5px;margin-top:8px")}>
          <span style={s(`width:17px;height:17px;border-radius:50%;background:${ink};display:inline-flex;align-items:center;justify-content:center;font:900 8.5px 'Fredoka';color:#fff;flex:none`)}>
            Y
          </span>
          <span style={s(`font:900 17px 'Fredoka';color:${ink}`)}>{item.price}</span>
        </div>
        <div style={s("display:flex;align-items:center;gap:5px;margin-top:7px;flex-wrap:wrap")}>
          <span style={s(`font:800 9.5px 'Nunito';color:${ink};background:${wash};padding:3px 7px;border-radius:7px`)}>
            {item.cond}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Watching({
  cartCount = 0,
  onOpenCart = () => {},
  watchedListings = [],
  onOpenProduct = () => {},
  onToggleWatchedListing = () => {},
  artStyle = 'vinyl',
}) {
  return (
    <div style={s('min-height:100%;background:#fff;color:#171326;padding-bottom:92px')}>
      <div style={s('position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #EEEAF6;padding:12px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px')}>
        <div>
          <div style={s(`font:800 22px 'Fredoka';color:${ink}`)}>Watching</div>
          <div style={s(`font:700 12px 'Nunito';color:${muted}`)}>Saved finds and watched drops</div>
        </div>
        <button type="button" aria-label="Open cart" onClick={onOpenCart} style={s(`border:0;border-radius:16px;background:${brand};color:#fff;padding:8px 11px;font:800 12px 'Fredoka';display:flex;align-items:center;gap:5px;cursor:pointer`)}>
          <span className="mi" style={s("font-size:16px;font-variation-settings:'FILL' 1")}>shopping_cart</span>
          {cartCount}
        </button>
      </div>
      <div style={s('padding:18px 16px 0')}>
        {watchedListings.length === 0 ? (
          <div style={s(`border:1px solid ${line};background:${wash};border-radius:8px;padding:18px`)}>
            <div style={s(`width:54px;height:54px;border-radius:18px;background:#FFE4F1;display:flex;align-items:center;justify-content:center;margin-bottom:11px;box-shadow:0 5px 0 rgba(255,61,154,.18)`)}>
              <span className="mi" style={s("font-size:27px;color:#FF3D9A;font-variation-settings:'FILL' 1")}>favorite</span>
            </div>
            <div style={s(`font:800 16px 'Fredoka';color:${ink}`)}>Nothing watched yet</div>
            <div style={s(`margin-top:6px;font:700 13px 'Nunito';color:${muted};line-height:1.35`)}>Heart items from the market later and they will land here.</div>
          </div>
        ) : (
          <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:12px")}>
            {watchedListings.map((item) => (
              <WatchedCard
                key={item.id}
                item={item}
                onOpenProduct={onOpenProduct}
                onToggleWatchedListing={onToggleWatchedListing}
                artStyle={artStyle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
