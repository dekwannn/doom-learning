// src/components/Layout/BottomNav.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  Map,
  Sparkles,
  BotMessageSquare,
  PenLine,
  UserRound,
  BookTextIcon as BookOpen,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Beranda',
    icon: House,
    activeColor: '#34d399',
    glowColor: 'rgba(52,211,153,0.65)',
  },
  {
    href: '/adventure',
    label: 'Petualangan',
    icon: Map,
    activeColor: '#fb923c',
    glowColor: 'rgba(251,146,60,0.65)',
  },
  {
    href: '/assistant',
    label: 'Lingo',
    icon: BotMessageSquare,
    activeColor: '#fff',
    glowColor: 'rgba(99,102,241,0.7)',
    elevated: true,
  },
  {
    href: '/learn',
    label: 'Materi',
    icon: BookOpen,
    activeColor: '#60a5fa',
    glowColor: 'rgba(96,165,250,0.65)',
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: UserRound,
    activeColor: '#c084fc',
    glowColor: 'rgba(192,132,252,0.65)',
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 50,
        background: 'rgba(7,7,12,0.97)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '22px 22px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.75)',
        height: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 2,
        paddingLeft: 4,
        paddingRight: 4,
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, activeColor, glowColor, elevated }) => {
        const active = pathname === href;

        if (elevated) {
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                minWidth: 52,
                marginTop: -26,
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: active
                    ? 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)'
                    : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  border: '2.5px solid rgba(7,7,12,0.97)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: active
                    ? `0 0 28px ${glowColor}, 0 4px 20px rgba(0,0,0,0.6)`
                    : '0 4px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
                  transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {/* Lingo himself in the middle of the menu */}
                <img src="/maskot.png" alt="" style={{ width: 36, height: 'auto', filter: active ? 'none' : 'saturate(0.85)' }} />
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: active ? '#fff' : '#3f3f46',
                  transition: 'color 0.2s',
                }}
              >
                {label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              minWidth: 52,
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* icon container */}
            <div
              style={{
                width: 40,
                height: 36,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? `${activeColor}14` : 'transparent',
                border: active ? `1px solid ${activeColor}28` : '1px solid transparent',
                filter: active ? `drop-shadow(0 0 6px ${glowColor})` : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon
                size={20}
                color={active ? activeColor : '#3f3f46'}
                strokeWidth={active ? 2.2 : 1.8}
                style={{ transition: 'all 0.2s ease' }}
              />
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: active ? activeColor : '#3f3f46',
                transition: 'color 0.2s',
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}