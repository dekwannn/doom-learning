// src/lib/safe-redirect.ts
// Hanya izinkan redirect ke halaman di dalam Lingora (path relatif seperti "/learn"),
// supaya parameter ?redirectTo= tidak bisa dipakai untuk melempar pengguna ke situs lain.
export function safeRedirect(path: string | null | undefined, fallback = '/'): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback
  return path
}
