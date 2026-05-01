// src/app/language-select/page.tsx
// Muncul SEKALI saja di awal (first launch setelah splash).
// Setelah bahasa dipilih, flag 'lingora_lang_chosen' disimpan di localStorage.
// Selanjutnya user ganti bahasa lewat pill di header — halaman ini tetap bisa
// diakses manual tapi tidak akan muncul otomatis lagi.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore, LANGUAGES, type LanguageDef } from '@/store/useLanguageStore';
import Image from 'next/image';

const LANG_CHOSEN_KEY = 'lingora_lang_chosen';

/* ─── Flag SVGs ──────────────────────────────────────────── */
function FlagEN() {
  return (
    <svg viewBox="0 0 60 40" width="32" height="22" style={{ borderRadius:3,flexShrink:0 }}>
      <rect width="60" height="40" fill="#012169"/>
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8"/>
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="5"/>
      <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="12"/>
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8"/>
    </svg>
  );
}
function FlagJA() {
  return (
    <svg viewBox="0 0 60 40" width="32" height="22" style={{ borderRadius:3,flexShrink:0 }}>
      <rect width="60" height="40" fill="#fff"/>
      <circle cx="30" cy="20" r="12" fill="#BC002D"/>
    </svg>
  );
}
function FlagKR() {
  return (
    <svg viewBox="0 0 60 40" width="32" height="22" style={{ borderRadius:3,flexShrink:0 }}>
      <rect width="60" height="40" fill="#fff"/>
      <circle cx="30" cy="20" r="10" fill="#CD2E3A"/>
      <path d="M30,10 A10,10,0,0,1,30,30" fill="#003478"/>
    </svg>
  );
}
function FlagFR() {
  return (
    <svg viewBox="0 0 60 40" width="32" height="22" style={{ borderRadius:3,flexShrink:0 }}>
      <rect width="20" height="40" fill="#002395"/>
      <rect x="20" width="20" height="40" fill="#fff"/>
      <rect x="40" width="20" height="40" fill="#ED2939"/>
    </svg>
  );
}

function FlagZH() {
  return (
    <svg viewBox="0 0 60 40" width="32" height="22" style={{ borderRadius: 3, flexShrink: 0 }}>
      <rect width="60" height="40" fill="#DE2910"/>
      {/* Bintang besar */}
      <polygon points="12,8 13.8,13.5 19.5,13.5 15,17 16.8,22.5 12,19 7.2,22.5 9,17 4.5,13.5 10.2,13.5"
        fill="#FFDE00" transform="scale(0.7) translate(5,3)"/>
      {/* 4 bintang kecil */}
      <polygon points="22,5 22.9,7.7 25.7,7.7 23.4,9.3 24.3,12 22,10.4 19.7,12 20.6,9.3 18.3,7.7 21.1,7.7"
        fill="#FFDE00" transform="scale(0.4) translate(18,2)"/>
      <polygon points="26,10 26.9,12.7 29.7,12.7 27.4,14.3 28.3,17 26,15.4 23.7,17 24.6,14.3 22.3,12.7 25.1,12.7"
        fill="#FFDE00" transform="scale(0.4) translate(22,-4)"/>
      <polygon points="26,16 26.9,18.7 29.7,18.7 27.4,20.3 28.3,23 26,21.4 23.7,23 24.6,20.3 22.3,18.7 25.1,18.7"
        fill="#FFDE00" transform="scale(0.4) translate(20,-12)"/>
      <polygon points="22,20 22.9,22.7 25.7,22.7 23.4,24.3 24.3,27 22,25.4 19.7,27 20.6,24.3 18.3,22.7 21.1,22.7"
        fill="#FFDE00" transform="scale(0.4) translate(14,-16)"/>
    </svg>
  );
}

const FLAG_MAP: Record<string, React.ReactNode> = {
  en: <FlagEN />,
  ja: <FlagJA />,
  zh: <FlagZH />,
  ko: <FlagKR />,   // ← cek sudah ada belum
  fr: <FlagFR />,
};

/* ─── Language Card ─────────────────────────────────────── */
function LanguageCard({ lang, selected, onSelect }: { lang:LanguageDef; selected:boolean; onSelect:()=>void }) {
  return (
    <button
      onClick={() => lang.available && onSelect()}
      style={{
        width:'100%', padding:'16px 18px', borderRadius:14,
        background: selected ? `${lang.color}14` : lang.available ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
        border: `1.5px solid ${selected ? lang.color : lang.available ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
        cursor: lang.available ? 'pointer' : 'default',
        display:'flex', alignItems:'center', gap:14, textAlign:'left',
        transition:'all 0.18s', opacity: lang.available ? 1 : 0.45,
        position:'relative', overflow:'hidden',
      }}
    >
      {selected && (
        <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse at left center,${lang.color}10,transparent 70%)`,pointerEvents:'none' }}/>
      )}
      <div style={{ flexShrink:0,borderRadius:6,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',lineHeight:0 }}>
        {FLAG_MAP[lang.code]}
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:'flex',alignItems:'baseline',gap:8,marginBottom:2 }}>
          <span style={{ color:selected?lang.color:lang.available?'#f4f4f5':'#52525b',fontSize:15,fontWeight:700 }}>{lang.name}</span>
          <span style={{ color:selected?`${lang.color}cc`:'#52525b',fontSize:13,fontFamily:lang.code==='ja'||lang.code==='ko'?'serif':'inherit' }}>{lang.nameLocal}</span>
        </div>
        <p style={{ color:'#52525b',fontSize:12,lineHeight:1.5,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{lang.description}</p>
      </div>
      <div style={{ flexShrink:0 }}>
        {selected ? (
          <div style={{ width:22,height:22,borderRadius:'50%',background:lang.color,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        ) : !lang.available ? (
          <span style={{ fontSize:10,fontWeight:700,color:'#3f3f46',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:99,padding:'3px 8px',letterSpacing:'0.05em' }}>SOON</span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
      </div>
    </button>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function LanguageSelectPage() {
  const router = useRouter();
  const selectLanguage   = useLanguageStore(s => s.selectLanguage);
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);
  const progress         = useLanguageStore(s => s.progress);

  const [chosen, setChosen]       = useState<string>(selectedLanguage ?? '');
  const [confirming, setConfirming] = useState(false);

  const chosenDef = LANGUAGES.find(l => l.code === chosen);

  const handleConfirm = () => {
    if (!chosen || confirming) return;
    setConfirming(true);
    selectLanguage(chosen);

    // Tandai bahwa user SUDAH PERNAH pilih bahasa.
    // Setelah ini, home page tidak akan redirect ke sini secara otomatis lagi.
    localStorage.setItem(LANG_CHOSEN_KEY, '1');

    setTimeout(() => router.push('/'), 300);
  };

  return (
    <main style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#050507' }}>
      <div style={{ width:'100%',maxWidth:768,height:'100vh',background:'#0a0a0d',display:'flex',flexDirection:'column',boxShadow:'0 0 60px rgba(0,0,0,0.8)',position:'relative',overflow:'hidden' }}>

        {/* Background glow */}
        {chosenDef && (
          <div style={{ position:'absolute',top:-80,right:-80,width:300,height:300,borderRadius:'50%',background:`radial-gradient(circle,${chosenDef.color}12 0%,transparent 70%)`,pointerEvents:'none',transition:'all 0.5s' }}/>
        )}

        {/* Scrollable content */}
        <div style={{ flex:1,overflowY:'auto',padding:'0 0 120px',scrollbarWidth:'none' }}>

          {/* Header */}
          <div style={{ padding:'56px 20px 32px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
              <Image src="/logo-home.png" alt="Lingora Logo" width={80} height={40} style={{ objectFit:'contain' }}/>
            </div>
            <h1 style={{ color:'#f4f4f5',fontSize:28,fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.2,margin:'0 0 10px' }}>
              Pilih bahasa<br/>yang ingin dipelajari
            </h1>
            <p style={{ color:'#71717a',fontSize:14,lineHeight:1.6,margin:0 }}>
              Setiap bahasa memiliki progress yang terpisah. Kamu bisa berganti bahasa kapan saja lewat tombol di header.
            </p>
          </div>

          {/* Language list */}
          <div style={{ padding:'0 16px',display:'flex',flexDirection:'column',gap:10 }}>
            {LANGUAGES.map(lang => (
              <LanguageCard key={lang.code} lang={lang} selected={chosen===lang.code} onSelect={()=>setChosen(lang.code)}/>
            ))}
          </div>

          {/* Saved progress info jika bahasa pernah dipilih sebelumnya */}
          {chosen && progress[chosen] && (
            <div style={{ margin:'20px 16px 0',padding:'14px 16px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:12 }}>
              <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,background:`${chosenDef?.color}14`,border:`1px solid ${chosenDef?.color}25`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill={chosenDef?.color}/>
                </svg>
              </div>
              <div>
                <p style={{ color:'#d4d4d8',fontSize:13,fontWeight:600,margin:'0 0 2px' }}>Progress tersimpan</p>
                <p style={{ color:'#52525b',fontSize:12,margin:0 }}>
                  {progress[chosen].xp} XP · {Object.values(progress[chosen].completedStages ?? {}).filter(Boolean).length} stage selesai
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Fixed CTA */}
        <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'16px 16px 32px',background:'linear-gradient(to top,#0a0a0d 60%,transparent)' }}>
          <button
            onClick={handleConfirm}
            disabled={!chosen || confirming}
            style={{
              width:'100%',height:54,borderRadius:14,
              background: chosenDef ? `linear-gradient(135deg,${chosenDef.color},${chosenDef.ring})` : 'rgba(255,255,255,0.05)',
              border:'none',
              color: chosen ? '#fff' : 'rgba(255,255,255,0.2)',
              fontSize:15,fontWeight:800,
              cursor: chosen ? 'pointer' : 'default',
              boxShadow: chosenDef ? `0 6px 24px ${chosenDef.color}40` : 'none',
              transition:'all 0.25s',letterSpacing:'-0.01em',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
            }}
          >
            {confirming ? (
              <div style={{ width:18,height:18,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',animation:'spin 0.7s linear infinite' }}/>
            ) : chosen ? (
              <>
                Mulai belajar {chosenDef?.name}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            ) : 'Pilih bahasa terlebih dahulu'}
          </button>
        </div>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </main>
  );
}