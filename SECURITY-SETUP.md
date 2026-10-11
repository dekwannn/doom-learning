# Keamanan Lingora — langkah setup

Perubahan di branch `security-hardening`:

| Masalah | Perbaikan di kode |
|---|---|
| Key Groq ikut terkirim ke browser (`NEXT_PUBLIC_GROQ_API_KEY`) | Semua panggilan AI lewat Supabase Edge Function `lingo-chat` (`supabase/functions/lingo-chat`). Key hanya ada di server. Function membatasi panjang input, jumlah token, model, dan jumlah request per pengguna/IP. |
| Keystore Android (`lingora-new`) ada di repo public | File dihapus dari repo; `*.jks`, `*.keystore`, `lingora-new`, `android/key.properties` masuk `.gitignore`. |

Klien memanggil AI lewat `lib/lingo-ai.ts` (`askLingo`). Ketiga tempat yang dulu memanggil Groq langsung
(`app/assistant/page.tsx`, `app/learn/[stageId]/ClientPage.tsx`, `components/LingoModal.tsx`) sekarang memakai helper ini.

---

## 1. Ganti (rotate) key Groq — wajib

Key lama sudah bisa dibaca siapa saja dari situs live, jadi anggap bocor.

1. Buka https://console.groq.com/keys → **hapus key lama** → buat key baru.
2. Simpan key baru hanya di Supabase (langkah 2). **Jangan** taruh di `.env` Next.js atau di Vercel lagi.

## 2. Pasang Edge Function di Supabase

Butuh Supabase CLI (`npx supabase ...`) dan *project ref* (lihat URL dashboard: `https://supabase.com/dashboard/project/<project-ref>`).

```bash
npx supabase login
npx supabase link --project-ref <project-ref>

# Tabel untuk pembatasan request (atau jalankan isi file SQL-nya di SQL Editor)
npx supabase db push

# Key Groq baru disimpan sebagai secret (tidak pernah masuk ke aplikasi)
npx supabase secrets set GROQ_API_KEY=<key-groq-baru>

# Deploy function. `verify_jwt = false` sudah diatur di supabase/config.toml, supaya tamu tetap bisa memakai Lingo;
# function sendiri yang membedakan pengguna login dan tamu, dengan batas yang lebih ketat untuk tamu.
# --use-api: build di server Supabase (tidak perlu Docker)
npx supabase functions deploy lingo-chat --use-api
```

**Model AI:** `llama-3.3-70b-versatile` sudah dimatikan Groq pada 16 Agustus 2026. Function memakai
`openai/gpt-oss-120b` (pengganti yang direkomendasikan Groq) dengan reasoning rendah. Kalau model ini nanti
juga dipensiunkan, cukup ganti lewat secret tanpa mengubah kode: `npx supabase secrets set GROQ_MODEL=<id-model>`.
Daftar model yang dipensiunkan: https://console.groq.com/docs/deprecations

Batas default (bisa diubah di `supabase/functions/lingo-chat/index.ts`, bagian `RATE`):
40 request / 10 menit untuk pengguna login, 12 request / 10 menit per IP untuk tamu.
Domain yang diizinkan ada di `ALLOWED_ORIGINS` — tambahkan domain lain jika nanti dipakai.

## 3. Bersihkan env lama

- Vercel → Project → Settings → Environment Variables → **hapus `NEXT_PUBLIC_GROQ_API_KEY`**, lalu redeploy.
- Hapus juga baris itu dari `.env.local` di komputermu.

Setelah redeploy, cek: buka situs → DevTools → Network → kirim pesan ke Lingo. Request harus menuju
`.../functions/v1/lingo-chat`, bukan `api.groq.com`.

## 4. Keystore Android

Aplikasi belum rilis di Play Store, jadi solusi termudah: **buat keystore baru** dan simpan di luar repo
(misalnya di password manager / folder pribadi). Keystore lama dianggap bocor dan jangan dipakai untuk rilis.

```bash
keytool -genkeypair -v -keystore ~/keys/lingora-release.jks -alias lingora -keyalg RSA -keysize 2048 -validity 10000
```

File lama masih ada di **riwayat** git. Untuk menghapusnya dari riwayat juga (opsional, karena keystore lama
toh tidak akan dipakai), gunakan `git filter-repo --path lingora-new --invert-paths` lalu `git push --force` —
ini menulis ulang riwayat, jadi lakukan hanya jika paham konsekuensinya.

## 5. Cek Row Level Security (RLS) di Supabase

Aplikasi dibuild sebagai *static export* (untuk Capacitor), jadi `middleware.ts` **tidak berjalan** di produksi.
Artinya, yang benar-benar melindungi data adalah **RLS** di database. Jalankan di SQL Editor:

```sql
-- Semua tabel public harus rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public';

-- Lihat policy yang ada
select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'public';
```

Yang perlu dipastikan untuk `profiles`: pengguna hanya bisa **membaca/mengubah barisnya sendiri**, misalnya:

```sql
create policy "own profile: update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
```

## 6. XP / leaderboard (anti-curang)

`hooks/useProgress.ts` mengirim `p_xp_to_add` langsung dari aplikasi ke RPC `upsert_xp`, jadi orang bisa
memanggilnya sendiri dengan angka besar. Tambahkan pengaman di **awal** fungsi `upsert_xp` (sesuaikan batasnya
dengan XP maksimum satu stage di aplikasimu — satu stage Chapter 1 memberi sekitar 160 XP):

```sql
if auth.uid() is null then raise exception 'not authenticated'; end if;
if p_xp_to_add < 0 or p_xp_to_add > 300 then raise exception 'invalid xp'; end if;
if p_stages_to_add < 0 or p_stages_to_add > 1 then raise exception 'invalid stages'; end if;
```

Pastikan juga fungsi itu menulis ke baris milik `auth.uid()` (bukan user id dari parameter).
Perbaikan paling kuat nanti: hitung XP di server (misalnya Edge Function yang memeriksa jawaban), bukan di aplikasi.
