"use client";

import { useRef, useState } from "react";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Inline player for a recorded voice note (served from a URL). */
export default function VoiceMessage({
  src,
  duration,
  mine,
}: {
  src: string;
  duration: number;
  mine: boolean;
}) {
  const url = src;
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play().catch(() => {});
    }
  }

  const accent = mine ? "text-teal-dark" : "text-teal";

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? "Pause" : "Play"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 ${accent} disabled:opacity-50`}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7Z" />
          </svg>
        )}
      </button>

      <div className="flex flex-col gap-1">
        <div className="h-1 w-32 overflow-hidden rounded-full bg-black/15">
          <div
            className={mine ? "h-full bg-teal-dark" : "h-full bg-teal"}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-ink/50">{formatDuration(duration)}</span>
      </div>

      {url && (
        <audio
          ref={audioRef}
          src={url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
          }}
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            if (a.duration) setProgress(a.currentTime / a.duration);
          }}
          className="hidden"
        />
      )}
    </div>
  );
}
