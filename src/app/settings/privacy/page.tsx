"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-dvh w-full flex-col bg-white">
      <header className="flex items-center gap-3 bg-teal px-4 py-4 text-white">
        <button aria-label="Back" onClick={() => router.back()} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Privacy policy</h1>
      </header>

      <div className="mx-auto w-full max-w-2xl space-y-5 overflow-y-auto px-6 py-8 text-sm leading-6 text-ink/70">
        <p className="text-xs text-ink/40">Last updated: June 2026</p>

        <Section title="Overview">
          Chatboat respects your privacy. This policy explains what information the app
          handles and how it is used. Chatboat is a demo application; data is stored on
          your device and on the app server only to make the chat features work.
        </Section>
        <Section title="Information we handle">
          Your name, email and phone number (used to create your account and verify it by
          OTP), your contacts that you add, and the messages, files and voice notes you
          send. Your profile picture is stored on your device.
        </Section>
        <Section title="How it is used">
          Account details identify you to people you chat with. Messages and files are
          delivered to the people you send them to. We do not sell your data or use it for
          advertising.
        </Section>
        <Section title="Storage & deletion">
          Account and contact data live in your browser&apos;s local storage. Messages and
          uploaded files live on the app server. Deleting your account removes your local
          data and your messages from the server.
        </Section>
        <Section title="Contact">
          Questions about this policy? Reach us through the app&apos;s support channel.
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
