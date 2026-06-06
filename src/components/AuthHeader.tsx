"use client";

import { useRouter } from "next/navigation";

/** Teal rounded header used on the register / login / OTP screens. */
export default function AuthHeader({
  title,
  subtitle,
  showBack = false,
}: {
  title: string;
  subtitle: string;
  showBack?: boolean;
}) {
  const router = useRouter();

  return (
    <header className="rounded-b-[28px] bg-teal px-6 pb-9 pt-6 text-white">
      {showBack && (
        <button
          aria-label="Go back"
          onClick={() => router.back()}
          className="mb-3 -ml-1 flex h-8 w-8 items-center justify-center"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-1.5 text-sm text-white/90">{subtitle}</p>
    </header>
  );
}
