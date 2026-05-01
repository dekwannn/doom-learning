// src/components/Achievement/AchievementPopup.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { useUserStore, ACHIEVEMENT_DEFS } from '@/store/useUserStore';
import {
  Zap, Target, CheckCircle, Timer, BookOpen, Library, GraduationCap,
  Flame, Compass, Globe, Moon, Sunrise, Sprout, Star, Gem, Crown, Trophy,
  CalendarCheck, Languages, BookMarked, Sparkles, Shield, PenLine, Sword,
  PenTool, Mountain, LucideIcon,
} from 'lucide-react';

/* ── Icon registry — map string name → Lucide component ── */
const ICON_MAP: Record<string, LucideIcon> = {
  Zap, Target, CheckCircle, Timer, BookOpen, Library, GraduationCap,
  Flame, Compass, Globe, Moon, Sunrise, Sprout, Star, Gem, Crown, Trophy,
  CalendarCheck, Languages, BookMarked, Sparkles, Shield, PenLine, Sword,
  PenTool, Mountain,
};

function AchIcon({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={2}/>;
}

export default function AchievementPopup() {
  const pendingAchievements       = useUserStore(s => s.pendingAchievements);
  const dismissPendingAchievement = useUserStore(s => s.dismissPendingAchievement);

  const [visible,  setVisible]  = useState(false);
  const [leaving,  setLeaving]  = useState(false);
  const [current,  setCurrent]  = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pendingAchievements.length > 0 && !visible && !leaving) {
      setCurrent(pendingAchievements[0]);
      setVisible(true);
      timerRef.current = setTimeout(dismiss, 3600);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pendingAchievements, visible, leaving]);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLeaving(true);
    setTimeout(() => { setVisible(false); setLeaving(false); setCurrent(null); dismissPendingAchievement(); }, 380);
  };

  if (!visible || !current) return null;
  const def = ACHIEVEMENT_DEFS.find(a => a.id === current);
  if (!def) return null;

  /* rarity border color */
  const rarityColor: Record<string, string> = {
    common: 'rgba(250,204,21,0.22)', rare: 'rgba(59,130,246,0.35)',
    epic: 'rgba(168,85,247,0.35)', legendary: 'rgba(236,72,153,0.45)',
  };
  const borderClr = rarityColor[def.rarity] ?? rarityColor.common;

  return (
    <>
      <style>{`
        @keyframes achIn  { from{opacity:0;transform:translateX(-50%) translateY(-24px) scale(0.9)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        @keyframes achOut { from{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} to{opacity:0;transform:translateX(-50%) translateY(-16px) scale(0.95)} }
        @keyframes achShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes achGlow { 0%,100%{box-shadow:0 0 18px ${def.color}20,0 12px 40px rgba(0,0,0,0.7)} 50%{box-shadow:0 0 32px ${def.color}45,0 12px 40px rgba(0,0,0,0.7)} }
        @keyframes achIcon { 0%{transform:scale(0) rotate(-15deg);opacity:0} 65%{transform:scale(1.2) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes achBarDrain { from{width:100%} to{width:0%} }
      `}</style>

      <div onClick={dismiss} style={{ position:'fixed', inset:0, zIndex:9998, cursor:'pointer' }}/>

      <div style={{
        position:'fixed', top:20, left:'50%', zIndex:9999,
        width:'calc(100vw - 28px)', maxWidth:400,
        animation: leaving
          ? 'achOut 0.38s cubic-bezier(0.4,0,1,1) forwards'
          : 'achIn 0.46s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        <div onClick={dismiss} style={{
          background:'linear-gradient(135deg,#0f0f1a 0%,#13131f 100%)',
          border:`1px solid ${borderClr}`,
          borderRadius:18, padding:'14px 16px',
          display:'flex', alignItems:'center', gap:13,
          animation:'achGlow 2.2s ease-in-out infinite',
          cursor:'pointer', overflow:'hidden', position:'relative',
        }}>
          {/* shimmer top line */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${def.color}70,transparent)`, backgroundSize:'200% 100%', animation:'achShimmer 2s linear infinite' }}/>

          {/* icon box */}
          <div style={{
            width:50, height:50, borderRadius:13, flexShrink:0,
            background:`${def.color}14`, border:`1px solid ${def.color}30`,
            display:'flex', alignItems:'center', justifyContent:'center',
            animation:'achIcon 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.08s both',
            boxShadow:`0 4px 14px ${def.color}20`,
          }}>
            <AchIcon name={def.iconName} color={def.color} size={22}/>
          </div>

          {/* text */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${def.color}12`, border:`1px solid ${def.color}25`, borderRadius:99, padding:'2px 9px', marginBottom:5 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:def.color, boxShadow:`0 0 4px ${def.color}` }}/>
              <span style={{ color:def.color, fontSize:9, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'system-ui,sans-serif' }}>
                Achievement Unlocked
              </span>
            </div>
            <p style={{ color:'#f4f4f5', fontSize:14, fontWeight:900, letterSpacing:'-0.02em', lineHeight:1, margin:'0 0 3px', fontFamily:'system-ui,sans-serif' }}>
              {def.label}
            </p>
            <p style={{ color:'#52525b', fontSize:11, lineHeight:1.4, margin:0, fontFamily:'system-ui,sans-serif' }}>
              {def.desc}
            </p>
          </div>

          {/* close hint */}
          <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#3f3f46" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
        </div>

        {/* drain bar */}
        <div style={{ height:2, background:'rgba(255,255,255,0.05)', borderRadius:'0 0 18px 18px', overflow:'hidden', marginTop:-2 }}>
          <div style={{ height:'100%', background:`linear-gradient(90deg,${def.color},${def.color}88)`, borderRadius:99, animation:visible&&!leaving?'achBarDrain 3.6s linear forwards':'none' }}/>
        </div>
      </div>
    </>
  );
}