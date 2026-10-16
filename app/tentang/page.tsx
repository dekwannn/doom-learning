// src/app/tentang/page.tsx
// Tentang: what Lingora is, who makes it and where the lessons come from.
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import LegalPage, { CONTACT_EMAIL, INSTAGRAM, OPERATOR } from '@/components/Legal/LegalPage';

export const metadata: Metadata = {
  title: 'Tentang · Lingora',
  description: 'Lingora: aplikasi belajar bahasa gratis bersama Lingo, untuk pemula yang berbahasa Indonesia.',
};

export default function TentangPage() {
  return (
    <LegalPage
      title="Tentang Lingora"
      intro={
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Image src="/maskot.png" alt="Lingo, maskot Lingora" width={72} height={68} style={{ flexShrink: 0, height: 'auto' }} />
          <p style={{ margin: 0 }}>
            Lingora adalah aplikasi belajar bahasa <strong>gratis</strong> untuk pemula yang berbahasa Indonesia, ditemani
            Lingo, maskot yang bisa diajak ngobrol dan latihan bicara.
          </p>
        </div>
      }
    >
      <h2>Bahasa yang bisa dipelajari</h2>
      <p>Bahasa Inggris, Jepang, Mandarin, dan Korea, semuanya dengan penjelasan dalam bahasa Indonesia.</p>

      <h2>Fitur</h2>
      <ul>
        <li><strong>Materi</strong>: pelajaran singkat dengan kosakata, contoh kalimat, dan latihan.</li>
        <li><strong>Adventure</strong>: belajar sambil menjelajahi peta stage demi stage dan mengumpulkan XP.</li>
        <li><strong>Kartu bicara</strong>: latihan mengucapkan kata dan kalimat, dengan cek pengucapan.</li>
        <li><strong>Skenario</strong>: simulasi percakapan dengan Lingo, misalnya di kafe, toko, hotel, atau bandara.</li>
        <li><strong>Ulas kata</strong>: kata yang sudah kamu temui diulang dengan jadwal bertahap supaya lebih lama diingat.</li>
        <li><strong>Lingo AI</strong>: tanya apa saja soal bahasa yang sedang kamu pelajari.</li>
        <li><strong>Papan peringkat</strong>, streak, dan achievement supaya belajar tetap rutin.</li>
      </ul>

      <h2>Dari mana materinya?</h2>
      <p>
        Materi bahasa Inggris disusun mengikuti tingkat A1 dari <strong>CEFR</strong> (Common European Framework of
        Reference for Languages, Dewan Eropa), dengan kosakata dari <a href="https://www.cefr-j.org">CEFR-J Wordlist</a> dan
        contoh kalimat dari <a href="https://tatoeba.org">Tatoeba</a> (CC BY 2.0 FR). Sumber dan tujuan belajar ditampilkan
        di setiap materi. Materi bahasa Jepang, Mandarin, dan Korea disusun oleh pengembang dan sumbernya sedang dilengkapi.
      </p>
      <p>
        Ulas kata memakai sistem kotak Leitner: kata yang dijawab benar muncul lagi setelah 1, 3, 7, 14, lalu 30 hari,
        dan kata yang salah diulang lagi dari awal. Cara ini didasarkan pada penelitian tentang pengulangan berjarak dan
        latihan mengingat.
      </p>

      <h2>Pembuat</h2>
      <p>
        Lingora dibuat dan dikelola oleh {OPERATOR}, pengembang perorangan dari Indonesia. Kritik, saran, dan laporan
        kesalahan materi sangat membantu. Kirim ke <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> atau lewat
        Instagram <a href={`https://instagram.com/${INSTAGRAM}`}>@{INSTAGRAM}</a>. Info lain ada di halaman <Link href="/kontak">Kontak</Link>.
      </p>
    </LegalPage>
  );
}
