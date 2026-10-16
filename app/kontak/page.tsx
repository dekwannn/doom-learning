// src/app/kontak/page.tsx
// Kontak: how to reach the developer, and what to put in the message.
import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { CONTACT_EMAIL, INSTAGRAM, OPERATOR } from '@/components/Legal/LegalPage';

export const metadata: Metadata = {
  title: 'Kontak · Lingora',
  description: 'Hubungi pengembang Lingora untuk pertanyaan, saran, laporan kesalahan, atau penghapusan akun.',
};

const card: React.CSSProperties = {
  display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
  padding: '14px 16px', textDecoration: 'none',
};

export default function KontakPage() {
  return (
    <LegalPage title="Kontak">
      <p>Lingora dikelola oleh {OPERATOR}. Pesan biasanya dibalas dalam beberapa hari.</p>

      <div style={{ display: 'grid', gap: 10, margin: '18px 0 8px' }}>
        <a href={`mailto:${CONTACT_EMAIL}`} style={card}>
          <span style={{ display: 'block', color: '#71717a', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Email</span>
          <span style={{ display: 'block', color: '#34d399', fontSize: 15.5, fontWeight: 700, marginTop: 4, wordBreak: 'break-all' }}>{CONTACT_EMAIL}</span>
        </a>
        <a href={`https://instagram.com/${INSTAGRAM}`} style={card}>
          <span style={{ display: 'block', color: '#71717a', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Instagram</span>
          <span style={{ display: 'block', color: '#34d399', fontSize: 15.5, fontWeight: 700, marginTop: 4 }}>@{INSTAGRAM}</span>
        </a>
      </div>

      <h2>Supaya cepat ditangani</h2>
      <ul>
        <li><strong>Kesalahan materi</strong>: sebutkan bahasa, nama materi atau stage, dan bagian yang salah.</li>
        <li><strong>Aplikasi bermasalah</strong>: sebutkan perangkat, browser, dan langkah sampai masalahnya muncul.
          Tangkapan layar sangat membantu.</li>
        <li><strong>Hapus akun</strong>: kirim dari email yang terdaftar dengan judul &quot;Hapus akun Lingora&quot;.
          Detailnya ada di <Link href="/privasi">Kebijakan Privasi</Link>.</li>
      </ul>
    </LegalPage>
  );
}
