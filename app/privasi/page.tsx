// src/app/privasi/page.tsx
// Kebijakan Privasi: what Lingora keeps, where it goes and how to have it removed. Keep it in step with the code:
// a new service or a new stored field belongs here too.
import type { Metadata } from 'next';
import LegalPage, { CONTACT_EMAIL, OPERATOR } from '@/components/Legal/LegalPage';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi · Lingora',
  description: 'Data apa yang dipakai Lingora, untuk apa, dibagikan ke siapa, dan cara menghapusnya.',
};

export default function PrivasiPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      updated="16 Oktober 2026"
      intro={
        <p style={{ margin: 0 }}>
          Singkatnya: kamu bisa belajar tanpa akun, dan progresnya tersimpan di perangkatmu sendiri. Kalau kamu masuk,
          kami menyimpan email, nama pengguna, foto profil, dan progres belajarmu supaya bisa dipakai di perangkat lain.
          Kami <strong>tidak menjual</strong> data pribadimu. Lingora menampilkan iklan dari Google AdSense, yang memakai cookie.
        </p>
      }
    >
      <p>
        Kebijakan ini menjelaskan bagaimana Lingora (<a href="https://lingora-learn.vercel.app">lingora-learn.vercel.app</a> dan
        aplikasinya) mengumpulkan, memakai, dan melindungi data pribadi penggunanya. Lingora dikelola oleh {OPERATOR},
        pengembang perorangan di Indonesia, dan kami berusaha mengikuti Undang-Undang Nomor 27 Tahun 2022 tentang
        Pelindungan Data Pribadi. Pertanyaan apa pun bisa dikirim ke <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>1. Data yang disimpan di perangkatmu</h2>
      <p>
        Sebagian besar data Lingora tinggal di penyimpanan lokal browser (localStorage) perangkatmu dan tidak dikirim
        ke mana pun, kecuali kamu masuk ke akun (lihat bagian 2):
      </p>
      <ul>
        <li>bahasa yang kamu pilih, XP, streak, stage dan materi yang sudah selesai, dan achievement;</li>
        <li>daftar kata untuk fitur <strong>Ulas kata</strong> beserta jadwal pengulangannya;</li>
        <li>pilihan suara Lingo dan penanda bahwa panduan awal sudah dilihat.</li>
      </ul>
      <p>
        Data ini hilang kalau kamu menghapus data situs di browser atau mencopot aplikasi. Kamu bisa menghapusnya
        sendiri kapan saja lewat pengaturan browser.
      </p>

      <h2>2. Data akun (kalau kamu masuk)</h2>
      <p>Akun bersifat pilihan. Kalau kamu mendaftar atau masuk, dengan Google atau dengan email, kami menyimpan:</p>
      <ul>
        <li><strong>Email</strong> dan cara masuk. Kalau kamu mendaftar dengan kata sandi, kata sandinya disimpan dalam
          bentuk hash oleh layanan autentikasi, jadi kami tidak pernah bisa melihatnya. Kalau kamu masuk dengan Google,
          kami menerima email, nama, dan foto profil dari akun Google-mu.</li>
        <li><strong>Profil</strong>: nama pengguna, foto profil, streak, dan kapan terakhir aktif. Data ini
          <strong> terlihat oleh pengguna lain</strong> di papan peringkat (leaderboard), bersama XP per bahasa.</li>
        <li><strong>Simpanan progres</strong>: salinan progres belajarmu supaya bisa dipulihkan di perangkat lain.
          Ini hanya bisa dibaca olehmu sendiri.</li>
      </ul>
      <p>
        Data akun disimpan di <a href="https://supabase.com/privacy">Supabase</a>, penyedia basis data dan autentikasi
        yang kami pakai, dengan aturan akses yang membatasi siapa yang boleh membaca dan mengubah setiap kolom.
      </p>

      <h2>3. Fitur yang mengirim data ke layanan lain</h2>
      <h3>Ngobrol dengan Lingo (AI)</h3>
      <p>
        Pesan yang kamu kirim ke Lingo diteruskan lewat server kami ke <a href="https://groq.com/privacy-policy/">Groq</a>,
        penyedia model AI, untuk dibuatkan jawaban. Lingora tidak menyimpan isi percakapan; percakapan hilang saat kamu
        menutup halaman. Untuk mencegah penyalahgunaan, kami mencatat kapan sebuah permintaan dibuat beserta ID akunmu
        (atau alamat IP kalau kamu tidak masuk), hanya untuk membatasi jumlah pesan, dan catatan itu dihapus secara berkala.
        Jangan menuliskan data pribadi yang sensitif di percakapan.
      </p>
      <h3>Suara Lingo dan cek pengucapan</h3>
      <p>
        Untuk membacakan teks dengan suara Lingo, teks tersebut dikirim ke server suara milik pengembang. Saat kamu
        memakai cek pengucapan, rekaman suaramu dikirim ke server yang sama untuk dinilai. Rekaman dan teks tidak
        disimpan ke file; server hanya menampilkan potongan teks dan nilainya di layar konsolnya sementara.
        Server ini diakses lewat layanan terowongan <a href="https://ngrok.com/privacy">ngrok</a>.
      </p>
      <h3>Pengenalan suara browser</h3>
      <p>
        Beberapa latihan bicara memakai fitur pengenalan suara bawaan browser (Web Speech API). Di sebagian browser,
        misalnya Google Chrome, suaramu diproses oleh layanan milik pembuat browser tersebut sesuai kebijakan privasi
        mereka. Lingora hanya menerima teks hasilnya, dan mikrofon hanya aktif setelah kamu mengizinkannya.
      </p>
      <h3>Avatar profil</h3>
      <p>
        Saat kamu mengganti nama pengguna, avatar baru dibuat oleh <a href="https://www.dicebear.com/legal/privacy-policy/">DiceBear</a> dari
        nama pengguna tersebut, jadi nama pengguna dikirim ke DiceBear setiap kali avatarnya ditampilkan.
      </p>
      <h3>Gambar dari GIPHY</h3>
      <p>
        Beberapa gambar animasi dimuat dari <a href="https://support.giphy.com/hc/en-us/articles/360032872931">GIPHY</a>,
        sehingga GIPHY menerima permintaan dari perangkatmu, termasuk alamat IP.
      </p>

      <h2>4. Iklan dan cookie</h2>
      <p>
        Lingora menampilkan iklan dari Google AdSense. Google dan mitranya memakai cookie untuk menampilkan iklan
        berdasarkan kunjunganmu ke situs ini dan situs lain. Kamu bisa menonaktifkan iklan yang dipersonalisasi di
        <a href="https://adssettings.google.com"> Setelan Iklan Google</a>, dan mempelajari cara Google memakai data di
        <a href="https://policies.google.com/technologies/partner-sites"> halaman ini</a>. Pengguna di Wilayah Ekonomi
        Eropa, Inggris, dan Swiss akan diminta persetujuan sebelum cookie iklan dipakai.
      </p>
      <p>
        Situs ini dihosting di <a href="https://vercel.com/legal/privacy-policy">Vercel</a>, yang secara standar mencatat
        data teknis seperti alamat IP dan jenis browser untuk keamanan dan menjalankan layanan.
      </p>

      <h2>5. Untuk apa data dipakai</h2>
      <ul>
        <li>menjalankan fitur belajar, menyimpan progres, dan memulihkannya di perangkat lain;</li>
        <li>menampilkan papan peringkat;</li>
        <li>menjawab pesanmu ke Lingo dan membatasi penyalahgunaan;</li>
        <li>menampilkan iklan yang membiayai Lingora agar tetap gratis.</li>
      </ul>
      <p>Kami tidak menjual data pribadi dan tidak memakainya untuk tujuan lain di luar daftar ini.</p>

      <h2>6. Anak-anak</h2>
      <p>
        Lingora bisa dipakai pelajar. Pengguna di bawah 13 tahun sebaiknya memakai Lingora tanpa akun atau dengan
        pendampingan orang tua atau wali. Kalau kamu orang tua dan mengetahui anakmu membuat akun tanpa izin,
        hubungi kami dan akun tersebut akan kami hapus.
      </p>

      <h2>7. Hakmu</h2>
      <p>
        Kamu berhak meminta salinan data akunmu, memperbaikinya, atau menghapusnya. Nama pengguna dan foto profil bisa
        kamu ubah sendiri di halaman Profil. Untuk menghapus akun beserta seluruh datanya, kirim email dari alamat yang
        terdaftar ke <a href={`mailto:${CONTACT_EMAIL}?subject=Hapus%20akun%20Lingora`}>{CONTACT_EMAIL}</a> dengan
        judul &quot;Hapus akun Lingora&quot;. Kami akan memprosesnya paling lambat dalam 14 hari.
      </p>

      <h2>8. Keamanan</h2>
      <p>
        Koneksi ke Lingora memakai HTTPS, dan basis data membatasi akses per pengguna. Meski begitu, tidak ada sistem
        yang sepenuhnya aman. Kalau terjadi kebocoran data yang menyangkut akunmu, kami akan memberi tahu lewat email.
      </p>

      <h2>9. Perubahan kebijakan</h2>
      <p>
        Kebijakan ini bisa berubah kalau fitur Lingora berubah. Tanggal di bagian atas menunjukkan versi terakhir.
        Untuk perubahan penting, kami akan memberi tahu di aplikasi.
      </p>
    </LegalPage>
  );
}
