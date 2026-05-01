// src/components/LanguageGuard.tsx
// Wrap any page that requires a language to be selected.
// Usage: <LanguageGuard><YourPage /></LanguageGuard>
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';

export default function LanguageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);

  useEffect(() => {
    if (!selectedLanguage) {
      router.replace('/language-select');
    }
  }, [selectedLanguage, router]);

  if (!selectedLanguage) {
    return (
      <main style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0a0a0d',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.1)',
          borderTopColor: '#3b82f6',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  return <>{children}</>;
}