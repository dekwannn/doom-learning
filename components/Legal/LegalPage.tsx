// src/components/Legal/LegalPage.tsx
// The frame of the information pages (Tentang, Kebijakan Privasi, Syarat Penggunaan, Kontak): a back link, the
// title, the date and readable text on the app's dark background. Server component, so the text is in the HTML.
import Link from 'next/link';
import type { ReactNode } from 'react';
import LegalLinks from './LegalLinks';

export const OPERATOR = 'Kadek Widiadnyana';
export const CONTACT_EMAIL = 'kdwidiadnyana51@gmail.com';
export const INSTAGRAM = 'wandevp';

export default function LegalPage({ title, updated, intro, children }: { title: string; updated?: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(170deg,#0c0c18 0%,#07070f 55%,#0a0710 100%)', color: '#d4d4d8', fontFamily: 'system-ui,sans-serif' }}>
      <style>{`
        .legal h2 { color: #f4f4f5; font-size: 17px; font-weight: 800; margin: 32px 0 10px; }
        .legal h3 { color: #e4e4e7; font-size: 14.5px; font-weight: 700; margin: 20px 0 6px; }
        .legal p, .legal li { font-size: 14.5px; line-height: 1.75; color: #a1a1aa; }
        .legal p { margin: 0 0 12px; }
        .legal ul { margin: 0 0 12px; padding-left: 20px; }
        .legal li { margin-bottom: 6px; }
        .legal strong { color: #e4e4e7; }
        .legal a { color: #34d399; text-decoration: underline; text-underline-offset: 3px; }
        .legal code { background: rgba(255,255,255,0.06); border-radius: 6px; padding: 1px 6px; font-size: 12.5px; color: #e4e4e7; }
      `}</style>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 48px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a1a1aa', fontSize: 13, fontWeight: 700, textDecoration: 'none', padding: '8px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
          ← Beranda
        </Link>
        <p style={{ margin: '28px 0 6px', color: '#10b981', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Lingora</p>
        <h1 style={{ margin: 0, color: '#fafafa', fontSize: 28, fontWeight: 900, lineHeight: 1.2 }}>{title}</h1>
        {updated && <p style={{ margin: '8px 0 0', color: '#52525b', fontSize: 12.5 }}>Terakhir diperbarui: {updated}</p>}
        <article className="legal" style={{ marginTop: 20 }}>
          {intro && <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 16, padding: '14px 16px', marginBottom: 8 }}>{intro}</div>}
          {children}
        </article>
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <LegalLinks />
        </div>
      </div>
    </main>
  );
}
