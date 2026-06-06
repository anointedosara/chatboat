"use client";

import { useState } from "react";

/**
 * Onboarding illustration. Renders the user-provided image at
 * `public/onboarding.png`. If that file is missing it falls back to a
 * styled placeholder so the flow still works — drop the real file in and
 * it appears automatically.
 */
export default function Illustration() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-mint">
      {failed ? (
        <div className="flex flex-col items-center gap-2 px-6 text-center text-teal-dark/70">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="9" r="1.5" />
            <path d="m3 16 4.5-4 4 3.5L16 11l5 5" />
          </svg>
          <span className="text-xs">Add public/onboarding.png</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/onboarding.png"
          alt="A person chatting on their phone"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
