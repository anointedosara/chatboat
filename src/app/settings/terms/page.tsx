"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-dvh w-full flex-col bg-white">
      <header className="flex items-center gap-3 bg-teal px-4 py-4 text-white">
        <button aria-label="Back" onClick={() => router.back()} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Terms &amp; condition</h1>
      </header>

      <div className="mx-auto w-full max-w-2xl space-y-5 overflow-y-auto px-6 py-8 text-sm leading-6 text-ink/70">
        <p className="text-xs text-ink/40">Last updated: June 2026</p>

        <Section title="1. Acceptance">
          By creating an account and using Chatboat you agree to these terms. If you do not
          agree, please do not use the app.
        </Section>
        <Section title="2. Your account">
          You are responsible for the activity on your account and for keeping your phone
          number and verification codes secure. Provide accurate information when
          registering.
        </Section>
        <Section title="3. Acceptable use">
          Do not use Chatboat to send unlawful, abusive, or harmful content, to harass
          other users, or to distribute malware. You may block users you do not wish to
          hear from.
        </Section>
        <Section title="4. Content">
          You own the messages and files you send. You are responsible for the content you
          share and the permissions to share it.
        </Section>
        <Section title="5. Service availability">
          Chatboat is provided on an &quot;as is&quot; basis as a demo and may change or be
          unavailable at any time without notice.
        </Section>
        <Section title="6. Termination">
          You may delete your account at any time from Settings. We may suspend accounts
          that violate these terms.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-ink">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
