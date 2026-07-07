import { s } from '../style.js';
import { makeTimedDrop } from '../data.js';
import { marketTheme } from '../marketTheme.js';
import { ULTRA_SIGNAL_VARIANTS } from '../ultraSignalVariants.js';

const { ink, wash, line, brand, attentionBadgeBackground, attentionBadgeText } = marketTheme;
const previewItem = { ...makeTimedDrop('ultra', () => 0.1), name: 'Cosmic Sticker Slab' };

function PriceLine({ dark = false }) {
  return (
    <div style={s(`display:flex;align-items:center;justify-content:center;gap:7px;margin-top:6px;font:900 14px 'Fredoka';color:${dark ? '#fff' : brand}`)}>
      <span style={s(`width:19px;height:19px;border-radius:50%;background:${dark ? '#fff' : ink};color:${dark ? ink : '#fff'};display:inline-flex;align-items:center;justify-content:center;font:900 10px 'Fredoka'`)}>Y</span>
      {previewItem.price}
    </div>
  );
}

function ArtStage({ variant }) {
  const border = variant === 'prize-ticket' ? '#171326' : variant === 'sticker-sheet' ? '#FFB84D' : '#FF3D9A';
  return (
    <div style={s(`position:relative;width:100%;height:248px;border-radius:${variant === 'prize-ticket' ? '18px' : '25px'};border:2px solid ${border};background:${previewItem.stripe};overflow:hidden;box-shadow:0 12px 24px rgba(23,19,38,.16)`)}>
      <img src={previewItem.imageUrl} alt={previewItem.name} style={s('width:100%;height:100%;object-fit:cover;display:block')} />
    </div>
  );
}

function FeedBackdrop() {
  const rows = ['Pocket Pixel MP3', 'Lucky Pog Stack', 'Desk Pet Dino', 'Cosmic Sticker Slab', 'Snack Charm'];
  return (
    <div style={s('position:absolute;inset:0;padding:86px 14px 18px;background:#F5F3FF;display:flex;flex-direction:column;gap:10px')}>
      <div style={s('position:absolute;top:18px;left:14px;right:14px;height:48px;border-radius:14px;background:#fff;border:1.5px solid #E6E2F6;box-shadow:0 4px 14px rgba(23,19,38,.06)')} />
      {rows.map((row, index) => (
        <div key={row} style={s(`display:flex;gap:10px;align-items:center;border:1.5px solid #EDEAF6;border-radius:14px;background:#fff;padding:10px;opacity:${index === 3 ? '.78' : '.58'};filter:${index === 3 ? 'none' : 'blur(.2px)'}`)}>
          <div style={s(`width:76px;height:76px;border-radius:12px;background:${index % 2 ? '#FFE4F1' : '#E9DEFF'}`)} />
          <div style={s('flex:1;min-width:0')}>
            <div style={s(`height:13px;width:${index === 3 ? '86%' : '70%'};border-radius:99px;background:#DCD5EF;margin-bottom:9px`)} />
            <div style={s('height:11px;width:46%;border-radius:99px;background:#F1ECFF')} />
          </div>
          <div style={s(`width:44px;height:28px;border-radius:10px;background:${index === 3 ? '#FFB84D' : '#6A5ACD'}`)} />
        </div>
      ))}
    </div>
  );
}

function FeedFreezeSignal() {
  return (
    <div style={s('position:absolute;inset:0;overflow:hidden;background:#F5F3FF')}>
      <FeedBackdrop />
      <div style={s('position:absolute;inset:0;background:rgba(23,19,38,.28);backdrop-filter:blur(2px)')} />
      <div style={s('position:absolute;left:18px;right:18px;top:91px;border:2px solid #FF3D9A;border-radius:24px;background:#fff;padding:12px;box-shadow:0 16px 0 rgba(255,61,154,.18),0 24px 42px rgba(23,19,38,.30);animation:ypop .24s ease both')}>
        <div style={s('display:flex;align-items:center;justify-content:center;margin-bottom:10px')}>
          <span style={s("display:inline-flex;align-items:center;gap:5px;background:#FF3D9A;color:#fff;border-radius:999px;padding:5px 10px;font:900 10px 'Fredoka';box-shadow:0 4px 0 #D11C77")}>
            <span className="mi" style={s("font-size:13px;font-variation-settings:'FILL' 1")}>notifications_active</span>
            ULTRA RARE SIGNAL
          </span>
        </div>
        <ArtStage variant="feed-freeze" />
        <div style={s(`margin-top:10px;font:900 22px/1 'Fredoka';color:${ink};text-align:center`)}>{previewItem.name}</div>
        <PriceLine />
        <div style={s('display:grid;grid-template-columns:1.15fr .85fr;gap:9px;margin-top:13px')}>
          <button type="button" style={s(`height:47px;border:0;border-radius:14px;background:${brand};color:#fff;font:900 13px 'Fredoka';box-shadow:0 5px 0 #4B3BA6`)}>Open signal</button>
          <button type="button" style={s(`height:47px;border:1.5px solid ${line};border-radius:14px;background:${wash};color:${ink};font:900 13px 'Fredoka'`)}>Keep scrolling</button>
        </div>
      </div>
    </div>
  );
}

function StickerSheetSignal() {
  return (
    <div style={s('position:absolute;inset:0;overflow:hidden;background:#F5F3FF')}>
      <div style={s('position:absolute;inset:0;background:radial-gradient(circle at 12% 14%,#FFE4F1 0 11%,transparent 12%),radial-gradient(circle at 88% 18%,#C7F5EC 0 10%,transparent 11%),radial-gradient(circle at 16% 86%,#FFF2C7 0 13%,transparent 14%),radial-gradient(circle at 86% 88%,#E9DEFF 0 12%,transparent 13%)')} />
      {['star', 'favorite', 'auto_awesome', 'sell', 'redeem'].map((icon, index) => (
        <span key={icon} className="mi" style={s(`position:absolute;left:${[24, 295, 43, 284, 168][index]}px;top:${[92, 112, 574, 586, 46][index]}px;font-size:${[28, 25, 32, 27, 23][index]}px;color:${['#FF3D9A', '#6A5ACD', '#FFB84D', '#10B5A0', '#FF6B3D'][index]};opacity:.34;transform:rotate(${[-13, 14, 9, -10, 8][index]}deg);font-variation-settings:'FILL' 1`)}>{icon}</span>
      ))}
      <div style={s('position:absolute;left:18px;right:18px;top:78px;border:2px dashed #FFB84D;border-radius:28px;background:#fff;padding:14px 13px 15px;box-shadow:0 12px 0 rgba(255,184,77,.25),0 24px 40px rgba(23,19,38,.20);overflow:hidden')}>
        <div style={s('position:absolute;right:-2px;top:-2px;width:58px;height:58px;background:linear-gradient(135deg,#FFE4F1 0 48%,#FF3D9A 49% 100%);border-left:2px solid #FFB84D;border-bottom:2px solid #FFB84D;border-radius:0 26px 0 18px')} />
        <div style={s('position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:9px')}>
          <span style={s(`display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:${attentionBadgeBackground};color:${attentionBadgeText};padding:6px 11px;font:900 11px 'Fredoka';box-shadow:0 4px 0 rgba(255,184,77,.28)`)}>
            <span className="mi" style={s("font-size:14px;font-variation-settings:'FILL' 1")}>sell</span>
            ULTRA RARE SIGNAL
          </span>
        </div>
        <ArtStage variant="sticker-sheet" />
        <div style={s('display:flex;justify-content:center;margin-top:10px')}>
          <span style={s("background:#FF3D9A;color:#fff;border-radius:11px;padding:5px 12px;font:900 12px 'Fredoka';transform:rotate(-2deg);box-shadow:0 4px 0 #D11C77")}>ONLY A TINY WINDOW IS OPEN</span>
        </div>
        <div style={s(`margin-top:8px;font:900 21px/1 'Fredoka';color:${ink};text-align:center`)}>{previewItem.name}</div>
        <PriceLine />
        <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:13px')}>
          <button type="button" style={s("height:46px;border:0;border-radius:14px;background:#FF3D9A;color:#fff;font:900 13px 'Fredoka';box-shadow:0 5px 0 #D11C77")}>Open signal</button>
          <button type="button" style={s(`height:46px;border:1.5px solid ${line};border-radius:14px;background:${wash};color:${ink};font:900 13px 'Fredoka'`)}>Keep scrolling</button>
        </div>
      </div>
    </div>
  );
}

function PrizeTicketSignal() {
  return (
    <div style={s('position:absolute;inset:0;overflow:hidden;background:#FFF3D1')}>
      <div style={s('position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,184,77,.18) 0 12px,transparent 12px 24px),radial-gradient(circle at 50% 18%,rgba(255,61,154,.20) 0 16%,transparent 17%)')} />
      <div style={s('position:absolute;left:15px;right:15px;top:74px;border:2px solid #171326;border-radius:24px;background:#fff;padding:0 13px 15px;box-shadow:0 14px 0 rgba(23,19,38,.18),0 24px 38px rgba(23,19,38,.24);overflow:hidden')}>
        <div style={s(`margin:0 -13px 12px;padding:11px 14px;background:${brand};color:#fff;display:flex;align-items:center;justify-content:center;gap:10px`)}>
          <span style={s("font:900 13px 'Fredoka'")}>YOINK PRIZE TICKET</span>
        </div>
        <div style={s('position:absolute;left:-15px;top:233px;width:30px;height:30px;border-radius:50%;background:#FFF3D1;border:2px solid #171326')} />
        <div style={s('position:absolute;right:-15px;top:233px;width:30px;height:30px;border-radius:50%;background:#FFF3D1;border:2px solid #171326')} />
        <div style={s(`font:900 25px/1 'Fredoka';color:${ink};text-align:center;margin-bottom:11px`)}>ULTRA RARE SIGNAL</div>
        <ArtStage variant="prize-ticket" />
        <div style={s(`margin-top:11px;font:900 22px/1 'Fredoka';color:${ink};text-align:center`)}>{previewItem.name}</div>
        <PriceLine />
        <div style={s('display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px')}>
          <span style={s("width:9px;height:9px;border-radius:50%;background:#FF3D9A")} />
          <span style={s(`font:900 11px 'Fredoka';color:${ink}`)}>claim window open</span>
          <span style={s("width:9px;height:9px;border-radius:50%;background:#10B5A0")} />
        </div>
        <div style={s('display:grid;grid-template-columns:1.15fr .85fr;gap:9px;margin-top:13px')}>
          <button type="button" style={s(`height:47px;border:0;border-radius:14px;background:${ink};color:#fff;font:900 13px 'Fredoka';box-shadow:0 5px 0 #4B3BA6`)}>Open signal</button>
          <button type="button" style={s('height:47px;border:1.5px solid #171326;border-radius:14px;background:#FFF8E7;color:#171326;font:900 13px Fredoka')}>Keep scrolling</button>
        </div>
      </div>
    </div>
  );
}

function VariantPhone({ variant }) {
  const content = {
    'feed-freeze': <FeedFreezeSignal />,
    'sticker-sheet': <StickerSheetSignal />,
    'prize-ticket': <PrizeTicketSignal />,
  }[variant.id];

  return (
    <section style={s('display:flex;flex-direction:column;gap:10px;align-items:center;min-width:0')}>
      <div style={s('width:100%;max-width:362px;display:flex;align-items:center;justify-content:space-between;gap:10px')}>
        <span style={s(`font:900 16px 'Fredoka';color:${ink}`)}>{variant.label}</span>
        <span style={s(`font:900 10px 'Fredoka';color:${attentionBadgeText};background:${attentionBadgeBackground};border-radius:999px;padding:4px 8px;white-space:nowrap`)}>{variant.badge}</span>
      </div>
      <div style={s('position:relative;width:100%;max-width:362px;aspect-ratio:362/724;border-radius:34px;overflow:hidden;background:#fff;box-shadow:0 18px 46px rgba(23,19,38,.18),0 0 0 1px rgba(23,19,38,.10)')}>
        {content}
      </div>
    </section>
  );
}

export default function UltraSignalPreview() {
  return (
    <main style={s("min-height:100vh;background:#F5F3FF;padding:24px;box-sizing:border-box;font-family:'Nunito',sans-serif;color:#171326")}>
      <div style={s('max-width:1210px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>
        <header style={s('display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap')}>
          <div>
            <div style={s(`font:900 25px/1 'Fredoka';color:${brand}`)}>Ultra Signal Concepts</div>
            <div style={s("font:800 12px 'Nunito';color:#7A7686;margin-top:5px")}>Cosmic Sticker Slab preview</div>
          </div>
          <div style={s(`display:flex;align-items:center;gap:5px;background:${brand};color:#fff;border-radius:999px;padding:6px 10px;font:900 12px 'Fredoka'`)}>
            <span style={s('width:18px;height:18px;border-radius:50%;background:#fff;color:#6A5ACD;display:inline-flex;align-items:center;justify-content:center;font:900 10px Fredoka')}>Y</span>
            Yoink
          </div>
        </header>
        <div style={s('display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;align-items:start')}>
          {ULTRA_SIGNAL_VARIANTS.map((variant) => (
            <VariantPhone key={variant.id} variant={variant} />
          ))}
        </div>
      </div>
    </main>
  );
}
