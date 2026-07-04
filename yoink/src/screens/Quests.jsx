import { useEffect, useRef, useState } from 'react';
import { s } from '../style.js';
import Mochi from '../components/Mochi.jsx';
import { streak as streakWeek } from '../data.js';
import { claimAllowance, claimQuest, fetchQuests, spinWheel } from '../api.js';
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

const SPIN_TRAVEL_MS = 2600;
const FULL_TURNS = 4;

// Six 60° slices in palette tones only — purples, orange, ink.
const wheelFace = `conic-gradient(${brand} 0 60deg,${attentionBadgeBackground} 60deg 120deg,${ink} 120deg 180deg,#8B78E6 180deg 240deg,#FFD9A0 240deg 300deg,#584AAE 300deg 360deg)`;

function QuestRow({ quest, onClaim, claiming }) {
  const pct = Math.min(100, Math.round((quest.have / quest.goal) * 100));
  return (
    <div style={s("display:flex;align-items:center;gap:11px;background:#fff;border:1px solid #EDEAF6;border-radius:16px;padding:11px 12px;box-shadow:0 2px 8px rgba(23,19,38,.05)")}>
      <div style={s(`width:38px;height:38px;flex:none;border-radius:12px;background:${quest.claimed ? wash : brand};display:flex;align-items:center;justify-content:center`)}>
        <span className="mi" style={s(`font-size:20px;color:${quest.claimed ? muted : '#fff'};font-variation-settings:'FILL' 1`)}>{quest.claimed ? 'check' : quest.icon}</span>
      </div>
      <div style={s("flex:1;min-width:0")}>
        <div style={s(`font:700 13px 'Nunito';color:${quest.claimed ? muted : ink}`)}>{quest.title}</div>
        <div style={s("display:flex;align-items:center;gap:7px;margin-top:5px")}>
          <div style={s(`flex:1;height:6px;border-radius:99px;background:${line};overflow:hidden`)}>
            <div style={s(`height:100%;width:${quest.claimed ? 100 : pct}%;background:linear-gradient(90deg,${brand},#8B78E6);border-radius:99px`)} />
          </div>
          <span style={s(`font:700 10.5px 'Nunito';color:${muted};font-variant-numeric:tabular-nums`)}>{Math.min(quest.have, quest.goal)}/{quest.goal}</span>
        </div>
      </div>
      {quest.claimed ? (
        <span style={s(`font:700 11px 'Fredoka';color:${muted};flex:none`)}>Claimed</span>
      ) : quest.claimable ? (
        <button
          type="button"
          onClick={() => onClaim(quest)}
          disabled={claiming}
          style={s(`flex:none;border:0;background:${brand};color:#fff;font:700 11.5px 'Fredoka';padding:7px 11px;border-radius:10px;box-shadow:0 4px 10px rgba(106,90,205,.34);cursor:pointer;${claiming ? 'opacity:.7' : ''}`)}
        >
          Claim +{quest.reward}
        </button>
      ) : (
        <span style={s(`flex:none;background:${attentionBadgeBackground};color:${attentionBadgeText};font:700 11px 'Fredoka';padding:3px 8px;border-radius:7px`)}>+{quest.reward}</span>
      )}
    </div>
  );
}

export default function Quests({ balance = 0, streak = 0, canClaim = false, canSpin = true, onWallet = () => {}, cartCount = 0, onOpenCart = () => {}, onToast = () => {} }) {
  const [quests, setQuests] = useState([]);
  const [claimingQuest, setClaimingQuest] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [reward, setReward] = useState(null);
  const rewardTimer = useRef(null);

  useEffect(() => {
    fetchQuests().then((data) => {
      if (Array.isArray(data.quests)) setQuests(data.quests);
    }).catch(() => {});
    return () => window.clearTimeout(rewardTimer.current);
  }, []);

  const handleClaimQuest = async (quest) => {
    if (claimingQuest) return;
    setClaimingQuest(quest.id);
    try {
      const result = await claimQuest(quest.id);
      if (result.ok) {
        if (result.wallet) onWallet(result.wallet);
        setQuests((current) => current.map((entry) => (
          entry.id === quest.id ? { ...entry, claimed: true, claimable: false } : entry
        )));
        onToast(`+${result.reward} coins — quest complete!`);
      }
    } finally {
      setClaimingQuest(null);
    }
  };

  const handleClaimAllowance = async () => {
    if (claiming || !canClaim) return;
    setClaiming(true);
    try {
      const result = await claimAllowance();
      if (result.ok) {
        setClaimed({ amount: result.amount, bonus: result.bonus });
        if (result.wallet) onWallet(result.wallet);
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleSpin = async () => {
    if (spinning || !canSpin) return;
    setSpinning(true);
    setReward(null);
    try {
      const result = await spinWheel();
      if (!result.ok) {
        setSpinning(false);
        if (result.wallet) onWallet(result.wallet);
        return;
      }
      // Land the winning slice (60° each, first slice centered 30° from top)
      // under the pointer after a few dramatic full turns.
      setSpinDeg((current) => current + FULL_TURNS * 360 + (360 - (result.segment * 60 + 30)) - (current % 360));
      rewardTimer.current = window.setTimeout(() => {
        setReward(result.reward);
        setSpinning(false);
        if (result.wallet) onWallet(result.wallet);
      }, SPIN_TRAVEL_MS);
    } catch {
      setSpinning(false);
    }
  };

  const spinLabel = spinning ? 'SPINNING…' : canSpin ? 'SPIN TO WIN' : 'SPUN TODAY';
  const dailyQuests = quests.filter((quest) => quest.period === 'daily');
  const weeklyQuests = quests.filter((quest) => quest.period === 'weekly');
  const questsLeft = quests.filter((quest) => !quest.claimed).length;

  return (
    <div style={s(`min-height:100%;background:${wash};display:flex;flex-direction:column;font-family:'Nunito',sans-serif;color:${ink}`)}>

      {/* ── header ── */}
      <div style={s("position:sticky;top:0;z-index:30;background:#fff;padding:47px 13px 11px;box-shadow:0 3px 14px rgba(23,19,38,.06)")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between")}>
          <div style={s("display:flex;align-items:center;gap:7px")}>
            <div style={s(`font:700 23px 'Fredoka';color:${brand};letter-spacing:.2px`)}>Yoink!</div>
            <div style={s(`font:700 9.5px 'Fredoka';letter-spacing:.6px;color:#fff;background:${brand};padding:3px 7px;border-radius:7px`)}>QUESTS</div>
          </div>
          <div style={s("display:flex;align-items:center;gap:7px")}>
            <div style={s(`display:flex;align-items:center;gap:5px;background:${currencyButtonBackground};border:1.5px solid ${currencyButtonBackground};border-radius:999px;padding:4px 10px 4px 5px`)}>
              <span style={s(`width:16px;height:16px;border-radius:50%;background:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 9px 'Fredoka';color:${currencyButtonBackground};flex:none`)}>Y</span>
              <span style={s("font:700 12px 'Fredoka';color:#fff")}>{balance.toLocaleString()}</span>
            </div>
            <div style={s(`display:flex;align-items:center;gap:3px;background:${attentionBadgeBackground};border-radius:999px;padding:4px 9px 4px 6px`)}>
              <span className="mi" style={s(`font-size:16px;color:${attentionBadgeText};font-variation-settings:'FILL' 1`)}>local_fire_department</span><span style={s(`font:700 12px 'Fredoka';color:${attentionBadgeText}`)}>{streak}</span>
            </div>
            <button
              type="button"
              aria-label="Open cart"
              onClick={onOpenCart}
              style={s(`position:relative;width:36px;height:36px;border:0;border-radius:11px;background:${wash};display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0`)}
            >
              <span className="mi" style={s(`font-size:21px;color:${ink}`)}>shopping_cart</span>
              <span style={s(`position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:${cartCountBackground};color:#fff;font:700 9.5px 'Fredoka';display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff`)}>{cartCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── content ── */}
      <div style={s("flex:1;padding:14px 14px 98px;display:flex;flex-direction:column;gap:15px")}>

        {/* level card */}
        <div style={s(`border-radius:20px;padding:15px;background:linear-gradient(135deg,${brand},#8B78E6);box-shadow:0 12px 24px rgba(106,90,205,.3);color:#fff`)}>
          <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px")}>
            <div style={s("display:flex;align-items:center;gap:10px")}>
              <div style={s("width:42px;height:42px;border-radius:13px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font:700 18px 'Fredoka';border:2px solid rgba(255,255,255,.5)")}>7</div>
              <div><div style={s("font:700 16px 'Fredoka'")}>Level 7</div><div style={s("font:600 11.5px 'Nunito';opacity:.9")}>Collector rank</div></div>
            </div>
            <button
              type="button"
              onClick={() => onToast('320 XP to go — the Level 8 chest unlocks then!')}
              style={s("display:flex;align-items:center;gap:5px;border:0;background:rgba(255,255,255,.2);color:#fff;padding:6px 11px;border-radius:11px;cursor:pointer")}
            ><span className="mi" style={s(`font-size:18px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>redeem</span><span style={s("font:700 12px 'Fredoka'")}>Reward</span></button>
          </div>
          <div style={s("height:9px;border-radius:99px;background:rgba(255,255,255,.28);overflow:hidden;margin-bottom:6px")}><div style={s(`height:100%;width:68%;background:${attentionBadgeBackground};border-radius:99px;box-shadow:0 0 8px rgba(255,184,77,.6)`)} /></div>
          <div style={s("font:600 11px 'Nunito';opacity:.92")}>320 XP to Level 8</div>
        </div>

        {/* streak card */}
        <div style={s("position:relative;border-radius:18px;padding:13px 14px;background:#fff;border:1px solid #EDEAF6;box-shadow:0 2px 8px rgba(23,19,38,.05)")}>
          <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px")}>
            <div style={s("display:flex;align-items:center;gap:6px")}><span className="mi" style={s(`font-size:20px;color:${attentionBadgeBackground};font-variation-settings:'FILL' 1`)}>local_fire_department</span><span style={s(`font:700 14px 'Fredoka';color:${ink}`)}>{streak}-day streak!</span></div>
            {canClaim ? (
              <button
                type="button"
                onClick={handleClaimAllowance}
                disabled={claiming}
                style={s(`border:0;display:inline-flex;align-items:center;gap:5px;background:${brand};color:#fff;font:700 12px 'Fredoka';padding:8px 13px;border-radius:11px;box-shadow:0 4px 10px rgba(106,90,205,.34);cursor:pointer;${claiming ? 'opacity:.7' : ''}`)}
              >
                <span className="mi" style={s("font-size:15px;font-variation-settings:'FILL' 1")}>redeem</span>
                {claiming ? 'Claiming…' : 'Claim daily coins'}
              </button>
            ) : claimed ? (
              <div style={s(`font:700 12px 'Fredoka';color:${brand};animation:ypop .45s ease both`)}>
                +{claimed.amount + claimed.bonus} coins{claimed.bonus > 0 ? ' (streak bonus!)' : ''}
              </div>
            ) : (
              <div style={s(`display:inline-flex;align-items:center;gap:4px;font:700 12px 'Fredoka';color:${brand}`)}>
                <span className="mi" style={s("font-size:15px;font-variation-settings:'FILL' 1")}>check_circle</span>
                Claimed today
              </div>
            )}
          </div>
          <div style={s("display:flex;justify-content:space-between")}>
            {streakWeek.map((day, i) => (
              <div key={i} style={s("display:flex;flex-direction:column;align-items:center;gap:5px")}>
                {day.done && (
                  <div style={s(`width:30px;height:30px;border-radius:50%;background:${attentionBadgeBackground};display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(255,184,77,.35)`)}><span className="mi" style={s(`font-size:17px;color:${attentionBadgeText};font-variation-settings:'FILL' 1`)}>check</span></div>
                )}
                {day.todo && (
                  <div style={s(`width:30px;height:30px;border-radius:50%;background:${wash};border:2px dashed ${line}`)} />
                )}
                <span style={s(`font:700 10px 'Nunito';color:${muted}`)}>{day.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* daily spin card */}
        <div style={s("position:relative;border-radius:22px;padding:16px;background:#fff;border:1px solid #EDEAF6;box-shadow:0 2px 8px rgba(23,19,38,.05);display:flex;align-items:center;gap:15px")}>
          <div style={s("position:relative;flex:none;width:104px;height:104px")}>
            <div style={s(`position:absolute;inset:0;border-radius:50%;background:${wheelFace};box-shadow:0 0 0 5px #fff,0 6px 16px rgba(23,19,38,.18);${spinDeg > 0 ? `transform:rotate(${spinDeg}deg);transition:transform ${SPIN_TRAVEL_MS}ms cubic-bezier(.16,.84,.22,1)` : 'animation:yspin 9s linear infinite'}`)} />
            <div style={s(`position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(23,19,38,.2);display:flex;align-items:center;justify-content:center;font:700 14px 'Fredoka';color:${brand}`)}>Y</div>
            <div style={s(`position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:13px solid ${ink};z-index:2`)} />
            {reward !== null && (
              <div style={s(`position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3;background:${ink};color:${attentionBadgeBackground};font:700 15px 'Fredoka';padding:7px 12px;border-radius:12px;white-space:nowrap;box-shadow:0 6px 16px rgba(23,19,38,.3);animation:ypop .45s ease both`)}>
                +{reward} coins!
              </div>
            )}
          </div>
          <div style={s("flex:1")}>
            <div style={s(`font:700 17px 'Fredoka';color:${ink}`)}>Daily Spin</div>
            <div style={s(`font:600 12.5px/1.35 'Nunito';color:${muted};margin:2px 0 11px`)}>
              {reward !== null ? `You won ${reward} coins — nice pull!` : canSpin ? '1 free spin left · win coins, rare drops & XP' : 'Free spin used · resets at midnight'}
            </div>
            <button
              type="button"
              onClick={handleSpin}
              disabled={spinning || !canSpin}
              style={s(`display:inline-flex;align-items:center;gap:6px;border:0;background:${canSpin ? brand : line};color:${canSpin ? '#fff' : muted};font:700 14px 'Fredoka';padding:10px 18px;border-radius:14px;box-shadow:${canSpin ? '0 4px 10px rgba(106,90,205,.34)' : 'none'};cursor:${canSpin && !spinning ? 'pointer' : 'default'}`)}
            >
              <span className="mi" style={s(`font-size:18px;font-variation-settings:'FILL' 1;${spinning ? 'animation:yspin 1s linear infinite' : ''}`)}>casino</span>
              {spinLabel}
            </button>
          </div>
        </div>

        <div style={s("display:flex;align-items:baseline;justify-content:space-between")}>
          <div style={s(`font:700 18px 'Fredoka';color:${ink}`)}>Today&#8217;s quests</div>
          <div style={s(`font:700 13px 'Nunito';color:${brand}`)}>{questsLeft} to finish</div>
        </div>
        <div style={s("display:flex;flex-direction:column;gap:9px")}>
          {dailyQuests.map((quest) => (
            <QuestRow key={quest.id} quest={quest} onClaim={handleClaimQuest} claiming={claimingQuest === quest.id} />
          ))}
        </div>

        <div style={s(`font:700 18px 'Fredoka';color:${ink};margin-top:2px`)}>This week</div>
        <div style={s("display:flex;flex-direction:column;gap:9px")}>
          {weeklyQuests.map((quest) => (
            <QuestRow key={quest.id} quest={quest} onClaim={handleClaimQuest} claiming={claimingQuest === quest.id} />
          ))}
        </div>

        <div style={s("display:flex;justify-content:flex-start;margin-top:2px")}>
          <Mochi color={brand} say="Finish a quest, earn the coins!" size={54} />
        </div>

      </div>
    </div>
  );
}
