// src/components/Legal/LegalLinks.tsx
// A small row of links to the information pages, for the bottom of the home and profile pages.
import Link from 'next/link';

const LINKS = [
  { href: '/tentang', label: 'Tentang' },
  { href: '/privasi', label: 'Kebijakan Privasi' },
  { href: '/syarat', label: 'Syarat Penggunaan' },
  { href: '/kontak', label: 'Kontak' },
];

export default function LegalLinks({ align = 'center' }: { align?: 'center' | 'left' }) {
  return (
    <nav aria-label="Informasi" style={{ fontFamily: 'system-ui,sans-serif', textAlign: align }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: '6px 16px' }}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} style={{ color: '#71717a', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            {l.label}
          </Link>
        ))}
      </div>
      <p style={{ margin: '8px 0 0', color: '#3f3f46', fontSize: 11 }}>Lingora · dibuat oleh Kadek Widiadnyana</p>
    </nav>
  );
}
