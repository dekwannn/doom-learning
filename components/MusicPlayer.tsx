'use client';
import { useEffect, useRef, useState } from 'react';

const TRACKS = [
  {
    id: 'lofi',
    label: 'Lo-Fi',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  },
  {
    id: 'forest',
    label: 'Forest',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_270f29b6e3.mp3',
  },
  {
    id: 'rain',
    label: 'Rain',
    url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9041f3597.mp3',
  },
  {
    id: 'focus',
    label: 'Focus',
    url: 'https://cdn.pixabay.com/audio/2023/03/09/audio_2c0bcb6e17.mp3',
  },
];

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Init audio
  useEffect(() => {
    const audio = new Audio(TRACKS[trackIndex].url);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = playing;
    audio.pause();
    audio.src = TRACKS[trackIndex].url;
    audio.loop = true;
    audio.volume = volume;
    if (wasPlaying) {
      audio.play().catch(() => {});
    }
  }, [trackIndex]);

  // Volume change
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const selectTrack = (i: number) => {
    setTrackIndex(i);
    setShowPicker(false);
    // auto-play when picking a new track
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
      setPlaying(true);
    }, 80);
  };

  const pillStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 99,
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div className="relative" ref={pickerRef}>
      {/* Main pill */}
      <div style={pillStyle}>
        {/* Play / pause */}
        <button
          onClick={toggle}
          className="active:scale-90 transition-transform"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {playing ? (
            // Pause — two bars
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <rect x="0" y="0" width="4" height="14" rx="1.5" fill="rgba(255,255,255,0.75)" />
              <rect x="8" y="0" width="4" height="14" rx="1.5" fill="rgba(255,255,255,0.75)" />
            </svg>
          ) : (
            // Play
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <polygon points="0,0 12,7 0,14" fill="rgba(255,255,255,0.75)" />
            </svg>
          )}
        </button>

        {/* Track name — tap to open picker */}
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="transition-colors"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: playing ? '#e4e4e7' : '#52525b',
            paddingRight: 12,
            paddingLeft: 2,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {TRACKS[trackIndex].label}
        </button>
      </div>

      {/* Track picker dropdown */}
      {showPicker && (
        <div
          className="absolute right-0 top-12 flex flex-col overflow-hidden"
          style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            minWidth: 140,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 100,
          }}
        >
          {/* Volume slider */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span style={{ fontSize: 11, color: '#3f3f46', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Vol
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1"
              style={{
                accentColor: '#10b981',
                height: 3,
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Track list */}
          {TRACKS.map((track, i) => (
            <button
              key={track.id}
              onClick={() => selectTrack(i)}
              className="flex items-center justify-between px-4 py-3 transition-colors text-left"
              style={{
                background: i === trackIndex ? 'rgba(16,185,129,0.07)' : 'transparent',
                borderBottom: i < TRACKS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: i === trackIndex ? 700 : 500, color: i === trackIndex ? '#e4e4e7' : '#71717a' }}>
                {track.label}
              </span>
              {i === trackIndex && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}