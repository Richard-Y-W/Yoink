import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { s } from '../style.js';
import { appendMarketFeed, filterMarketFeed, makeMarketFeed, MARKET_MAX_ITEMS, MARKET_MODES, MARKET_PAGE_SIZE, MARKET_SORTS, marketCats, sortMarketFeed } from '../data.js';
import { fetchFeed } from '../api.js';
import { marketTheme } from '../marketTheme.js';
import ItemArt from '../components/ItemArt.jsx';
import { ART_STYLE_LABELS, artStageBackground, resolveArtKind } from '../itemArt.js';

const {
  ink,
  wash,
  line,
  muted,
  brand,
  activeChipBackground,
  currencyButtonBackground,
  cartCountBackground,
  attentionBadgeBackground,
  attentionBadgeText,
} = marketTheme;

function RareDropBurst({ item, onView = () => {}, onSkip = () => {} }) {
  if (!item) return null;

  return (
    <div style={s('position:absolute;inset:0;z-index:970;background:rgba(23,19,38,.36);display:flex;align-items:center;justify-content:center;padding:20px;animation:ypop .22s ease both')}>
      <div style={s("position:relative;width:100%;max-width:360px;overflow:hidden;border:2px solid #FFB84D;border-radius:24px;background:#fff;padding:22px 18px 18px;box-shadow:0 16px 0 rgba(255,184,77,.24),0 18px 40px rgba(23,19,38,.30);text-align:center")}>
        <div style={s('position:absolute;inset:-80px;background:radial-gradient(circle at 50% 30%,#FFF2C7 0 16%,transparent 17%),radial-gradient(circle at 18% 72%,#FFE4F1 0 10%,transparent 11%),radial-gradient(circle at 86% 78%,#B8F5D0 0 10%,transparent 11%);opacity:.9;pointer-events:none')} />
        <div style={s('position:relative;display:flex;flex-direction:column;align-items:center')}>
          <div style={s("width:58px;height:58px;border-radius:20px;background:#FF3D9A;color:#fff;display:flex;align-items:center;justify-content:center;font:900 36px 'Fredoka';box-shadow:0 7px 0 #D11C77")}>!</div>
          <div style={s(`margin-top:10px;font:900 25px 'Fredoka';color:${ink}`)}>ULTRA RARE DROP</div>
          <div style={s(`font:800 12px 'Nunito';color:${muted};margin-top:3px`)}>A one-off style listing just surfaced.</div>
          <div style={s(`position:relative;width:156px;height:134px;border-radius:32px;background:${item.imageUrl ? '#fff' : item.stripe};border:1.5px solid #EEEAF8;margin:16px 0 12px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 8px 18px rgba(106,90,205,.16)`)}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} style={s('width:100%;height:100%;object-fit:contain;display:block;padding:10px;box-sizing:border-box')} />
            ) : (
              <ItemArt kind={resolveArtKind(item)} artStyle="vinyl" width={116} />
            )}
          </div>
          <div style={s(`font:900 18px 'Fredoka';color:${ink}`)}>{item.name}</div>
          <div style={s(`display:flex;align-items:center;gap:6px;margin-top:5px;font:900 13px 'Fredoka';color:${brand}`)}>
            <span style={s(`width:18px;height:18px;border-radius:50%;background:${ink};color:#fff;display:inline-flex;align-items:center;justify-content:center;font:900 10px 'Fredoka'`)}>Y</span>
            {item.price}
            <span style={s(`color:${muted};font:800 11px 'Nunito'`)}>{item.stockLabel}</span>
          </div>
          <div style={s('display:grid;grid-template-columns:1.2fr .9fr;gap:9px;width:100%;margin-top:16px')}>
            <button type="button" onClick={onView} style={s(`height:48px;border:0;border-radius:15px;background:${brand};color:#fff;font:900 14px 'Fredoka';cursor:pointer;box-shadow:0 5px 0 #4B3BA6`)}>
              View listing
            </button>
            <button type="button" onClick={onSkip} style={s(`height:48px;border:1.5px solid ${line};border-radius:15px;background:${wash};color:${ink};font:900 14px 'Fredoka';cursor:pointer`)}>
              Keep scrolling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ item, onOpenProduct = () => {}, saved = false, onToggleSave = () => {}, artStyle = 'vinyl' }) {
  const artKind = resolveArtKind(item);
  const rare = item.flashTier === 'rare';
  const ultra = item.flashTier === 'ultra';
  const flashBorder = ultra ? '#FF3D9A' : rare ? '#FFB84D' : '#EDEAF6';
  const flashShadow = ultra
    ? '0 9px 0 rgba(255,61,154,.12),0 4px 14px rgba(23,19,38,.08)'
    : rare
      ? '0 9px 0 rgba(255,184,77,.16),0 4px 14px rgba(23,19,38,.08)'
      : '0 2px 8px rgba(23,19,38,.05)';
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
      style={s(`position:relative;display:flex;gap:11px;background:#fff;border:${rare || ultra ? '2px' : '1px'} solid ${flashBorder};border-radius:14px;padding:10px;box-shadow:${flashShadow};cursor:pointer;${rare || ultra ? 'animation:ypop .36s ease both' : ''}`)}
    >
      {rare && (
        <div style={s("position:absolute;top:-12px;left:14px;z-index:2;display:flex;align-items:center;gap:5px;background:#FF3D9A;color:#fff;border-radius:999px;padding:4px 9px;font:900 10px 'Fredoka';box-shadow:0 4px 0 rgba(209,28,119,.35)")}>
          <span style={s("width:16px;height:16px;border-radius:7px;background:#fff;color:#FF3D9A;display:flex;align-items:center;justify-content:center;font:900 13px 'Fredoka'")}>!</span>
          RARE FLASH
        </div>
      )}
      <div style={s(`position:relative;width:96px;height:96px;flex:none;border-radius:10px;overflow:hidden;background:${item.imageUrl ? '#fff' : artKind ? artStageBackground(artStyle, artKind) : item.stripe};display:flex;align-items:center;justify-content:center`)}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} style={s('width:100%;height:100%;object-fit:cover;display:block')} />
        ) : artKind && <ItemArt kind={artKind} artStyle={artStyle} width={86} />}
      </div>
      <div style={s("flex:1;min-width:0;display:flex;flex-direction:column")}>
        <div style={s(`font:700 13px/1.28 'Nunito';color:${ink};max-height:34px;overflow:hidden;padding-right:22px`)}>
          {item.name}
        </div>
        <div style={s("display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:5px 0 6px")}>
          <span style={s(`font:700 9.5px 'Nunito';color:${ink};background:${wash};padding:2px 7px;border-radius:6px`)}>
            {item.cond}
          </span>
          {item.topRated && (
            <span style={s(`display:inline-flex;align-items:center;gap:2px;font:700 9.5px 'Nunito';color:${attentionBadgeText};background:${attentionBadgeBackground};padding:2px 7px 2px 5px;border-radius:6px`)}>
              <span className="mi" style={s("font-size:11px;font-variation-settings:'FILL' 1")}>star</span>
              Top Rated
            </span>
          )}
          {item.isBin && <span style={s("font:700 10.5px 'Nunito';color:#7A7686")}>Buy It Now</span>}
          {ultra && (
            <span style={s(`font:700 10.5px 'Nunito';color:${attentionBadgeText};background:${attentionBadgeBackground};padding:1px 6px;border-radius:5px`)}>
              Ultra Rare Drop
            </span>
          )}
        </div>
        <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-top:auto")}>
          <div style={s("min-width:0")}>
            <div style={s("display:flex;align-items:center;gap:4px")}>
              <span style={s(`width:17px;height:17px;border-radius:50%;background:${ink};display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:#fff;flex:none`)}>
                Y
              </span>
              <span style={s(`font:700 17px 'Fredoka';color:${ink}`)}>{item.price}</span>
            </div>
            <div style={s("display:flex;align-items:center;gap:5px;margin-top:3px;font:600 10px 'Nunito';color:#8C8A99")}>
              {item.shipFree && <span style={s(`color:${ink};font-weight:700`)}>Free shipping</span>}
              {item.paidShip && <span>{item.ship}</span>}
              <span>&middot; {item.seller} {item.fb}</span>
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onOpenProduct(item, item.cta);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onOpenProduct(item, item.cta);
              }
            }}
            style={s(`background:${brand};color:#fff;font:700 12px 'Fredoka';padding:8px 15px;border-radius:11px;white-space:nowrap;box-shadow:0 4px 10px rgba(106,90,205,.34);cursor:pointer`)}
          >
            {item.cta}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label={saved ? 'Remove from watching' : 'Watch this listing'}
        aria-pressed={saved}
        onClick={(event) => {
          event.stopPropagation();
          onToggleSave(item.id);
        }}
        style={s(`position:absolute;top:9px;right:9px;width:26px;height:26px;border:0;border-radius:50%;background:${saved ? '#FFE4F1' : wash};display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;${saved ? 'animation:ypop .3s ease both' : ''}`)}
      >
        <span className="mi" style={s(`font-size:15px;color:${saved ? '#FF3D9A' : '#7A7686'};${saved ? "font-variation-settings:'FILL' 1" : ''}`)}>favorite</span>
      </button>
    </div>
  );
}

export default function MonoMarket({
  onOpenProduct = () => {},
  onOpenCart = () => {},
  onOpenWallet = () => {},
  cartCount = 0,
  balance = 0,
  artStyle = 'vinyl',
  onCycleArtStyle = () => {},
  watchedIds = [],
  onToggleWatchedListing = () => {},
  searchMode = false,
  onSearchSubmit = () => {},
  onPageLoad = () => {},
  onRareFlash = () => {},
  onUltraRareFlash = () => {},
  bell = null,
  onBellTap = () => {},
}) {
  const [feed, setFeed] = useState(() => makeMarketFeed(0, MARKET_PAGE_SIZE));
  const [selectedCategory, setSelectedCategory] = useState('For you');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('All');
  const [sortIndex, setSortIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ultraBurstItem, setUltraBurstItem] = useState(null);

  const cycleMode = () => setMode((current) => MARKET_MODES[(MARKET_MODES.indexOf(current) + 1) % MARKET_MODES.length]);
  const cycleSort = () => setSortIndex((current) => (current + 1) % MARKET_SORTS.length);
  const feedEndRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastLoadRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const announcedFlashIdsRef = useRef(new Set());
  const hasMore = feed.length < MARKET_MAX_ITEMS;

  const feedLengthRef = useRef(MARKET_PAGE_SIZE);
  const notifiedFeedLengthRef = useRef(MARKET_PAGE_SIZE);
  useEffect(() => {
    feedLengthRef.current = feed.length;
    if (feed.length > notifiedFeedLengthRef.current) {
      notifiedFeedLengthRef.current = feed.length;
      onPageLoad();
    }
  }, [feed.length, onPageLoad]);

  useEffect(() => {
    if (!searchMode) return;
    searchInputRef.current?.focus?.();
  }, [searchMode]);

  useEffect(() => {
    const newFlashItems = feed.filter((item) => (
      item.flashTier && !announcedFlashIdsRef.current.has(item.id)
    ));
    if (newFlashItems.length === 0) return;
    newFlashItems.forEach((item) => announcedFlashIdsRef.current.add(item.id));
    const ultra = newFlashItems.find((item) => item.flashTier === 'ultra');
    if (ultra) {
      onUltraRareFlash(ultra);
      setUltraBurstItem(ultra);
      return;
    }
    onRareFlash(newFlashItems[0]);
  }, [feed, onRareFlash, onUltraRareFlash]);

  // Next pages come from the backend; the local generator (same logic the
  // server uses) stays as an offline fallback so scrolling never dead-ends.
  const loadMore = useCallback(() => {
    if (feedLengthRef.current >= MARKET_MAX_ITEMS) return;
    if (loadingMoreRef.current) return;
    const now = Date.now();
    if (now - lastLoadRef.current < 200) return;
    lastLoadRef.current = now;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const start = feedLengthRef.current;
    fetchFeed(start, MARKET_PAGE_SIZE).then((page) => {
      if (!Array.isArray(page.items) || page.items.length === 0) return;
      setFeed((existing) => (existing.length === start ? existing.concat(page.items) : existing));
    }).catch(() => {
      setFeed((existing) => (existing.length === start ? appendMarketFeed(existing) : existing));
    }).finally(() => {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    });
  }, []);

  const categoryChips = useMemo(() => marketCats, []);
  const searchTerm = query.trim().toLowerCase();
  const filtersActive = Boolean(searchTerm) || selectedCategory !== 'For you' || mode !== 'All';
  const visibleFeed = sortMarketFeed(
    filterMarketFeed(feed, { category: selectedCategory, mode, query }),
    MARKET_SORTS[sortIndex].id,
  );

  // While filtering, keep paging the backend until enough matches surface.
  useEffect(() => {
    if (filtersActive && hasMore && visibleFeed.length < MARKET_PAGE_SIZE) loadMore();
  }, [filtersActive, hasMore, visibleFeed.length, loadMore, feed.length]);

  useEffect(() => {
    const target = feedEndRef.current;
    if (!target) return undefined;

    if (typeof IntersectionObserver === 'function') {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      }, { root: null, rootMargin: '380px 0px 520px', threshold: 0.01 });
      observer.observe(target);
      return () => observer.disconnect();
    }

    const onScroll = () => {
      const viewportBottom = window.scrollY + window.innerHeight;
      const pageBottom = Math.max(
        document.documentElement?.scrollHeight ?? 0,
        document.body?.scrollHeight ?? 0,
      );
      if (viewportBottom >= pageBottom - 420) loadMore();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [loadMore]);

  const submitSearch = () => {
    if (!query.trim() && !searchMode) return;
    searchInputRef.current?.blur?.();
    onSearchSubmit();
  };
  const searchStatusText = (() => {
    if (filtersActive && visibleFeed.length > 0) {
      return `${visibleFeed.length} find${visibleFeed.length === 1 ? '' : 's'} matched`;
    }
    if (filtersActive) return hasMore ? 'Searching the market...' : 'No more matching finds';
    if (loadingMore) return 'Finding more finds...';
    return hasMore ? 'Scroll for more finds' : 'All finds loaded';
  })();
  const showSearchSpinner = loadingMore && (!filtersActive || visibleFeed.length === 0);

  return (
    <div style={s(`min-height:100%;background:${wash};display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:${ink}`)}>
      <RareDropBurst
        item={ultraBurstItem}
        onView={() => {
          const item = ultraBurstItem;
          setUltraBurstItem(null);
          if (item) onOpenProduct(item, 'ultra-drop');
        }}
        onSkip={() => setUltraBurstItem(null)}
      />
      <div style={s("position:sticky;top:0;z-index:30;background:#FFFFFF;padding:18px 13px 11px;box-shadow:0 3px 14px rgba(23,19,38,.06)")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:10px")}>
          <div style={s("display:flex;align-items:center;gap:8px")}>
            <div style={s(`font:700 23px 'Fredoka';color:${brand};letter-spacing:.2px`)}>Yoink!</div>
            {bell && (
              <button
                type="button"
                aria-label={bell.live ? 'The floor is open — trade now' : `Next bell at ${bell.label}`}
                onClick={onBellTap}
                style={s(`display:flex;align-items:center;gap:4px;border:0;border-radius:999px;padding:4px 9px 4px 6px;cursor:pointer;background:${bell.live ? attentionBadgeBackground : wash};${bell.live ? 'animation:ypulse 1.6s infinite' : ''}`)}
              >
                <span className="mi" style={s(`font-size:14px;color:${bell.live ? attentionBadgeText : brand};font-variation-settings:'FILL' 1`)}>notifications_active</span>
                <span style={s(`font:700 10.5px 'Fredoka';color:${bell.live ? attentionBadgeText : ink}`)}>{bell.live ? 'FLOOR OPEN' : bell.label}</span>
              </button>
            )}
          </div>
          <div style={s("display:flex;align-items:center;gap:7px")}>
            <button
              type="button"
              aria-label="Open Yoink rewards"
              onClick={onOpenWallet}
              style={s(`display:flex;align-items:center;gap:5px;background:${currencyButtonBackground};border:1.5px solid ${currencyButtonBackground};border-radius:999px;padding:4px 10px 4px 5px;cursor:pointer`)}
            >
              <span style={s(`width:16px;height:16px;border-radius:50%;background:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:${currencyButtonBackground};flex:none`)}>Y</span>
              <span style={s("font:700 12px 'Fredoka';color:#fff")}>{balance.toLocaleString()}</span>
            </button>
            <div
              role="button"
              tabIndex={0}
              aria-label="Open cart"
              onClick={onOpenCart}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenCart();
                }
              }}
              style={s(`position:relative;width:36px;height:36px;border-radius:11px;background:${wash};display:flex;align-items:center;justify-content:center;cursor:pointer`)}
            >
              <span className="mi" style={s(`font-size:21px;color:${ink}`)}>shopping_cart</span>
              <span style={s(`position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:${cartCountBackground};color:#fff;font:700 9.5px 'Fredoka';display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff`)}>
                {cartCount}
              </span>
            </div>
          </div>
        </div>
        <div style={s(`display:flex;align-items:center;background:${wash};border:1.5px solid ${line};border-radius:12px;overflow:hidden;height:44px`)}>
          <button
            type="button"
            aria-label={`Listing type: ${mode}. Tap to change`}
            onClick={cycleMode}
            style={s(`display:flex;align-items:center;gap:2px;padding:0 11px;height:100%;border:0;border-right:1.5px solid ${line};background:${mode === 'All' ? 'transparent' : '#fff'};cursor:pointer`)}
          >
            <span style={s(`font:700 12.5px 'Nunito';color:${mode === 'All' ? ink : brand};white-space:nowrap`)}>{mode}</span>
            <span className="mi" style={s(`font-size:16px;color:${muted}`)}>expand_more</span>
          </button>
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitSearch();
            }}
            placeholder="Search 2M listings..."
            aria-label="Search listings"
            autoFocus={searchMode}
            style={s(`flex:1;min-width:0;height:100%;border:0;background:transparent;padding:0 11px;font:600 16px 'Nunito';color:${ink};outline:none`)}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              style={s(`border:0;background:transparent;padding:0 4px;display:flex;align-items:center;cursor:pointer;color:${muted}`)}
            >
              <span className="mi" style={s("font-size:19px")}>close</span>
            </button>
          )}
          <button
            type="button"
            aria-label="Search market"
            onClick={submitSearch}
            style={s(`width:48px;height:100%;border:0;background:${ink};display:flex;align-items:center;justify-content:center;cursor:pointer`)}
          >
            <span className="mi" style={s("font-size:22px;color:#fff")}>search</span>
          </button>
        </div>
      </div>

      <div style={s("flex:1;display:flex;flex-direction:column")}>
        <div className="ynoscroll" style={s("display:flex;gap:7px;overflow-x:auto;padding:12px 13px 4px")}>
          <button
            type="button"
            onClick={() => setSelectedCategory('For you')}
            style={s(`border:0;flex:none;padding:7px 13px;border-radius:9px;background:${selectedCategory === 'For you' ? activeChipBackground : '#fff'};font:700 12.5px 'Nunito';color:${selectedCategory === 'For you' ? '#fff' : '#3A3A42'};white-space:nowrap;cursor:pointer`)}
          >
            For you
          </button>
          {categoryChips.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={s(`border:${selectedCategory === cat ? '0' : `1.5px solid ${line}`};flex:none;padding:${selectedCategory === cat ? '8.5px 14.5px' : '7px 13px'};border-radius:9px;background:${selectedCategory === cat ? activeChipBackground : '#fff'};font:700 12.5px 'Nunito';color:${selectedCategory === cat ? '#fff' : '#3A3A42'};white-space:nowrap;cursor:pointer`)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={s("display:flex;align-items:center;justify-content:space-between;padding:13px 13px 8px")}>
          <div style={s(`font:700 16px 'Fredoka';color:${ink}`)}>{searchTerm ? `Finds for "${query.trim()}"` : searchMode ? 'Search the market' : 'Fresh listings'}</div>
          <div style={s("display:flex;align-items:center;gap:12px")}>
            <button
              type="button"
              aria-label={`Item art style: ${ART_STYLE_LABELS[artStyle]}. Tap to change`}
              onClick={onCycleArtStyle}
              style={s(`display:flex;align-items:center;gap:3px;border:1.5px solid ${line};background:#fff;padding:3px 8px;border-radius:8px;cursor:pointer`)}
            >
              <span className="mi" style={s(`font-size:14px;color:${brand}`)}>palette</span>
              <span style={s(`font:700 11px 'Nunito';color:${brand}`)}>{ART_STYLE_LABELS[artStyle]}</span>
            </button>
            <button
              type="button"
              aria-label={`Sort: ${MARKET_SORTS[sortIndex].label}. Tap to change`}
              onClick={cycleSort}
              style={s("display:flex;align-items:center;gap:2px;border:0;background:transparent;padding:0;cursor:pointer")}
            >
              <span style={s(`font:700 12px 'Nunito';color:${sortIndex === 0 ? ink : brand}`)}>{MARKET_SORTS[sortIndex].label}</span>
              <span className="mi" style={s(`font-size:16px;color:${sortIndex === 0 ? ink : brand}`)}>swap_vert</span>
            </button>
          </div>
        </div>

        <div style={s("display:flex;flex-direction:column;gap:10px;padding:0 13px 100px")}>
          {visibleFeed.map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              onOpenProduct={onOpenProduct}
              saved={watchedIds.includes(item.id)}
              onToggleSave={() => onToggleWatchedListing(item)}
              artStyle={artStyle}
            />
          ))}
          {filtersActive && visibleFeed.length === 0 && !hasMore && (
            <div style={s(`padding:26px 16px;border:1.5px dashed #DCD5EF;border-radius:16px;background:#fff;text-align:center;font:700 13px 'Nunito';color:${muted}`)}>
              No finds match — try &ldquo;polaroid&rdquo;, &ldquo;duck&rdquo;, or clear the filters
            </div>
          )}
          <div ref={feedEndRef} style={s("display:flex;flex-direction:column;align-items:center;gap:9px;padding:20px 0 6px")}>
            {showSearchSpinner && <div style={s(`width:28px;height:28px;border-radius:50%;border:3px solid ${line};border-top-color:${ink};animation:yspin .8s linear infinite`)} />}
            <span style={s(`font:700 11px 'Nunito';color:${muted}`)}>
              {searchStatusText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
