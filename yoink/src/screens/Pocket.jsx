import { useEffect, useMemo, useState } from 'react';
import { fetchCollection } from '../api.js';
import PocketShelf from '../components/PocketShelf.jsx';
import HoloTrophyViewer from '../components/HoloTrophyViewer.jsx';
import { makePocketHoloItems } from '../pocketItems.js';
import { s } from '../style.js';
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

const noop = () => {};

function PocketHeader({ balance, cartCount, onOpenCart }) {
  return (
    <div style={s('position:sticky;top:0;z-index:30;background:#fff;padding:47px 13px 12px;box-shadow:0 3px 14px rgba(23,19,38,.06)')}>
      <div style={s('display:flex;align-items:center;justify-content:space-between;gap:10px')}>
        <div style={s('min-width:0')}>
          <div style={s(`font:800 24px/1 'Fredoka';color:${brand}`)}>Pocket</div>
          <div style={s(`margin-top:3px;font:800 11.5px/1.2 'Nunito';color:${muted}`)}>Owned Holo Finds</div>
        </div>
        <div style={s('display:flex;align-items:center;gap:7px;flex:none')}>
          <div style={s(`display:flex;align-items:center;gap:5px;background:${currencyButtonBackground};border:1.5px solid ${currencyButtonBackground};border-radius:999px;padding:4px 10px 4px 5px`)}>
            <span style={s(`width:16px;height:16px;border-radius:50%;background:#fff;display:inline-flex;align-items:center;justify-content:center;font:800 9px 'Fredoka';color:${currencyButtonBackground};flex:none`)}>Y</span>
            <span style={s("font:800 12px 'Fredoka';color:#fff")}>{balance.toLocaleString()}</span>
          </div>
          <button
            type="button"
            aria-label="Open cart"
            onClick={onOpenCart}
            style={s(`position:relative;width:38px;height:38px;border:0;border-radius:13px;background:${wash};display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;box-shadow:0 3px 0 #E3DDF7`)}
          >
            <span className="mi" style={s(`font-size:21px;color:${ink}`)}>shopping_cart</span>
            <span style={s(`position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:${cartCountBackground};color:#fff;font:800 9.5px 'Fredoka';display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff`)}>{cartCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingPocket() {
  return (
    <div style={s('background:#fff;border:1.5px solid #EDEAF6;border-radius:20px;padding:26px 18px;min-height:188px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 14px rgba(106,90,205,.10)')}>
      <div style={s('display:flex;flex-direction:column;align-items:center;gap:11px')}>
        <span style={s(`width:38px;height:38px;border:4px solid ${line};border-top-color:${brand};border-radius:50%;display:block;animation:yspin .8s linear infinite`)} />
        <span style={s(`font:800 13px 'Nunito';color:${muted}`)}>Loading Pocket</span>
      </div>
    </div>
  );
}

function EmptyPocket({ onOpenMarket }) {
  return (
    <div style={s('background:#fff;border:1.5px solid #EDEAF6;border-radius:22px;padding:22px 18px 20px;min-height:296px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 8px 0 rgba(106,90,205,.10),0 8px 20px rgba(23,19,38,.08)')}>
      <div style={s(`width:82px;height:82px;border-radius:26px;background:linear-gradient(135deg,#E7F8FF,#FFE4F1 58%,#FFF3D1);border:2px solid ${line};display:flex;align-items:center;justify-content:center;box-shadow:0 6px 0 #DCD5EF;margin-bottom:15px`)}>
        <span className="mi" style={s(`font-size:39px;color:${brand};font-variation-settings:'FILL' 1`)}>auto_awesome</span>
      </div>
      <div style={s(`font:900 22px/1.05 'Fredoka';color:${ink}`)}>Your Pocket is waiting</div>
      <div style={s(`margin-top:8px;max-width:250px;font:800 13px/1.35 'Nunito';color:${muted}`)}>
        Yoink a Holo Finds drop and it will land on this shelf.
      </div>
      <button
        type="button"
        onClick={onOpenMarket}
        style={s(`margin-top:17px;border:0;border-radius:15px;background:${brand};color:#fff;font:900 13px 'Fredoka';padding:11px 16px;display:inline-flex;align-items:center;gap:5px;box-shadow:0 5px 0 #4B3BA6;cursor:pointer`)}
      >
        <span className="mi" style={s("font-size:17px;font-variation-settings:'FILL' 1")}>storefront</span>
        Back to market
      </button>
    </div>
  );
}

export default function Pocket({
  balance = 0,
  cartCount = 0,
  onOpenCart = noop,
  onOpenMarket = noop,
  onToast = noop,
}) {
  const [collection, setCollection] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerItem, setViewerItem] = useState(null);

  useEffect(() => {
    let alive = true;

    fetchCollection()
      .then((data) => {
        if (!alive) return;
        setCollection(Array.isArray(data?.collection) ? data.collection : []);
      })
      .catch(() => {
        if (!alive) return;
        setCollection([]);
        onToast('Pocket could not load right now.');
      });

    return () => {
      alive = false;
    };
  }, [onToast]);

  const holoItems = useMemo(() => makePocketHoloItems(collection ?? []), [collection]);
  const holoImagesReady = holoItems.some((item) => item.imageUrl);

  return (
    <div style={s(`min-height:100%;background:${wash};display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:${ink}`)}>
      <PocketHeader balance={balance} cartCount={cartCount} onOpenCart={onOpenCart} />

      <main
        data-holo-images={holoImagesReady ? 'ready' : 'empty'}
        style={s('flex:1;padding:15px 14px 98px;display:flex;flex-direction:column;gap:14px')}
      >
        <div style={s(`display:flex;align-items:center;justify-content:space-between;gap:10px;background:${attentionBadgeBackground};border-radius:16px;padding:10px 12px;box-shadow:0 4px 0 rgba(255,184,77,.32)`)}>
          <div style={s('display:flex;align-items:center;gap:8px;min-width:0')}>
            <span className="mi" style={s(`font-size:22px;color:${attentionBadgeText};font-variation-settings:'FILL' 1`)}>workspace_premium</span>
            <span style={s(`font:900 13px 'Fredoka';color:${attentionBadgeText};white-space:nowrap`)}>Holo shelf</span>
          </div>
          <span style={s(`font:900 12px 'Nunito';color:${attentionBadgeText};white-space:nowrap`)}>{holoItems.length} owned</span>
        </div>

        {collection === null ? (
          <LoadingPocket />
        ) : holoItems.length > 0 ? (
          <PocketShelf
            items={holoItems}
            selectedIndex={Math.min(selectedIndex, holoItems.length - 1)}
            onSelect={setSelectedIndex}
            onOpen={setViewerItem}
          />
        ) : (
          <EmptyPocket onOpenMarket={onOpenMarket} />
        )}
      </main>

      <HoloTrophyViewer item={viewerItem} onClose={() => setViewerItem(null)} />
    </div>
  );
}
