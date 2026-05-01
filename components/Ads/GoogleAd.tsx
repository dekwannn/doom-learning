'use client';
import { useEffect } from 'react';

interface GoogleAdProps {
  slotId: string; // Nanti diisi dengan ID Slot dari AdSense
  className?: string;
}

export default function GoogleAd({ slotId, className }: GoogleAdProps) {
  useEffect(() => {
    // Meminta Google untuk merender iklan begitu komponen ini muncul
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`w-full flex justify-center overflow-hidden ${className || ''}`} style={{ minHeight: '100px' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', textAlign: 'center' }}
        data-ad-client="ca-pub-6934703851524831" // <-- Ini ID unik milikmu yang tadi
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}