// src/app/syarat/page.tsx
// Syarat Penggunaan: the rules for using Lingora.
import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { CONTACT_EMAIL, OPERATOR } from '@/components/Legal/LegalPage';

export const metadata: Metadata = {
  title: 'Syarat Penggunaan · Lingora',
  description: 'Aturan memakai Lingora: akun, fitur AI, konten, iklan, dan batas tanggung jawab.',
};

export default function SyaratPage() {
  return (
    <LegalPage title="Syarat Penggunaan" updated="16 Oktober 2026">
      <p>
        Dengan memakai Lingora, kamu menyetujui syarat berikut. Lingora dikelola oleh {OPERATOR}. Kalau kamu tidak
        setuju, mohon jangan memakai Lingora.
      </p>

      <h2>1. Layanan</h2>
      <p>
        Lingora adalah aplikasi belajar bahasa gratis: materi, petualangan (adventure), kartu bicara, simulasi
        percakapan, ulas kata, dan asisten AI bernama Lingo. Fitur bisa ditambah, diubah, atau dihentikan sewaktu-waktu.
        Lingora disediakan apa adanya dan bisa sesekali tidak tersedia, misalnya saat perawatan.
      </p>

      <h2>2. Akun</h2>
      <ul>
        <li>Kamu bisa belajar tanpa akun. Akun diperlukan untuk menyimpan progres di cloud dan tampil di papan peringkat.</li>
        <li>Jaga kerahasiaan akunmu. Kamu bertanggung jawab atas aktivitas di akunmu.</li>
        <li>Nama pengguna dan foto profil terlihat oleh pengguna lain. Jangan memakai nama atau gambar yang kasar,
          menyinggung, menyamar sebagai orang lain, atau melanggar hak orang lain.</li>
        <li>Pengguna di bawah 13 tahun sebaiknya memakai Lingora dengan pendampingan orang tua atau wali.</li>
      </ul>

      <h2>3. Penggunaan yang tidak diperbolehkan</h2>
      <ul>
        <li>mencurangi XP, streak, atau papan peringkat, termasuk dengan skrip atau mengubah data aplikasi;</li>
        <li>membanjiri, menyerang, atau mencoba membobol layanan dan server Lingora;</li>
        <li>memakai Lingo untuk membuat konten yang melanggar hukum, kebencian, kekerasan, atau pelecehan;</li>
        <li>mengeklik iklan secara sengaja berulang kali atau meminta orang lain melakukannya.</li>
      </ul>
      <p>Kami boleh menangguhkan atau menghapus akun yang melanggar aturan ini.</p>

      <h2>4. Tentang Lingo (AI)</h2>
      <p>
        Jawaban Lingo dibuat oleh model AI dan <strong>bisa salah</strong>, termasuk soal tata bahasa, arti kata, atau
        fakta. Gunakan sebagai teman latihan, bukan sumber yang pasti benar. Jangan mengirim data pribadi yang sensitif
        ke Lingo. Cara pesanmu diproses dijelaskan di <Link href="/privasi">Kebijakan Privasi</Link>.
      </p>

      <h2>5. Konten dan sumber</h2>
      <p>
        Desain, maskot Lingo, teks, gambar, dan kode Lingora adalah milik pengembang, kecuali yang disebutkan berasal
        dari pihak lain. Sebagian materi memakai sumber terbuka, antara lain contoh kalimat dari
        <a href="https://tatoeba.org"> Tatoeba</a> (lisensi CC BY 2.0 FR, dengan nama penulis di setiap kalimat) dan daftar
        kata <a href="https://www.cefr-j.org">CEFR-J Wordlist</a>. Sumber ini dicantumkan di materi yang memakainya.
        Kamu boleh memakai Lingora untuk belajar pribadi, tetapi tidak boleh menyalin dan menyebarkan ulang isinya
        untuk tujuan komersial tanpa izin.
      </p>

      <h2>6. Iklan</h2>
      <p>
        Lingora gratis dan dibiayai iklan dari Google AdSense. Kami tidak mengendalikan isi iklan secara langsung dan tidak
        bertanggung jawab atas produk atau layanan yang diiklankan.
      </p>

      <h2>7. Batas tanggung jawab</h2>
      <p>
        Kami berusaha agar materi Lingora akurat dan bermanfaat, tetapi tidak menjamin hasil belajar tertentu, misalnya
        lulus ujian atau sertifikasi. Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian akibat memakai
        atau tidak bisa memakai Lingora, termasuk hilangnya progres yang tersimpan di perangkat.
      </p>

      <h2>8. Hukum yang berlaku</h2>
      <p>Syarat ini diatur oleh hukum Republik Indonesia.</p>

      <h2>9. Perubahan dan kontak</h2>
      <p>
        Syarat ini bisa diperbarui. Tanggal di bagian atas menunjukkan versi terakhir, dan dengan tetap memakai Lingora
        setelah perubahan, kamu dianggap menyetujuinya. Pertanyaan bisa dikirim ke
        <a href={`mailto:${CONTACT_EMAIL}`}> {CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
