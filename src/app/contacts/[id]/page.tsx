"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import ConfirmDialog from "@/components/ConfirmDialog";
import { blockUser, getContact, isBlocked, unblockUser, type Contact } from "@/lib/store";
import { getCurrentUser } from "@/lib/users";
import { startCall } from "@/lib/callClient";

export default function ContactProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  useEffect(() => {
    const c = getContact(params.id) ?? null;
    setContact(c);
    if (c) setBlocked(isBlocked(c.phone));
    setLoaded(true);
  }, [params.id]);

  async function placeCall(type: "voice" | "video") {
    const me = getCurrentUser();
    if (!me || !contact) return;
    const callId = await startCall(me.phone, contact.phone, type, me.name);
    router.push(`/call/${contact.phone}?role=caller&callId=${callId}&type=${type}`);
  }

  function toggleBlock() {
    if (!contact) return;
    if (blocked) {
      unblockUser(contact.phone);
      setBlocked(false);
    } else {
      blockUser(contact.phone);
      setBlocked(true);
    }
    setConfirmBlock(false);
  }

  if (loaded && !contact) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-white">
        <p className="text-ink/60">Contact not found.</p>
        <Link href="/contacts" className="font-semibold text-teal-dark">Back to contacts</Link>
      </div>
    );
  }
  if (!contact) return null;

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#f4f6f7]">
      {/* Teal hero */}
      <header className="flex flex-col items-center bg-teal px-5 pb-8 pt-4 text-white">
        <div className="mb-4 flex w-full items-center">
          <button aria-label="Back" onClick={() => router.back()} className="p-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
          </button>
        </div>
        <Avatar name={contact.name} size={96} />
        <h1 className="mt-3 text-2xl font-bold">{contact.name}</h1>
        <p className="text-sm text-white/85">+{contact.phone}</p>

        <div className="mt-6 flex gap-3">
          <ActionButton label="Message" href={`/chats/${contact.id}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
            </svg>
          </ActionButton>
          <ActionButton label="Voice" onClick={() => placeCall("voice")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
          </ActionButton>
          <ActionButton label="Video" onClick={() => placeCall("video")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="m23 7-7 5 7 5V7Z" /><rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </ActionButton>
        </div>
      </header>

      <div className="space-y-3 p-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Phone</p>
          <p className="mt-1 text-ink">+{contact.phone}</p>
        </div>

        <button
          onClick={() => (blocked ? toggleBlock() : setConfirmBlock(true))}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left font-medium text-red-500 shadow-sm hover:bg-black/[0.02]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" strokeLinecap="round" />
          </svg>
          {blocked ? `Unblock ${contact.name}` : `Block ${contact.name}`}
        </button>
      </div>

      {confirmBlock && (
        <ConfirmDialog
          title={`Block ${contact.name}?`}
          message="You won't be able to send or receive messages from this contact until you unblock them."
          confirmLabel="Block"
          danger
          onConfirm={toggleBlock}
          onCancel={() => setConfirmBlock(false)}
        />
      )}
    </div>
  );
}

function ActionButton({
  label,
  href,
  onClick,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const inner = (
    <>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
        {children}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </>
  );
  const cls = "flex w-20 flex-col items-center gap-1.5";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
