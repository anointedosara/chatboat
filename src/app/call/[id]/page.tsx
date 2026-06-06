"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import { addCall, formatDuration, getContact, type Contact } from "@/lib/store";

export default function CallPage() {
  return (
    <Suspense fallback={null}>
      <CallScreen />
    </Suspense>
  );
}

function CallScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const type = search.get("type") === "video" ? "video" : "voice";

  const [contact, setContact] = useState<Contact | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [phase, setPhase] = useState<"connecting" | "active">("connecting");
  const [seconds, setSeconds] = useState(0);

  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    const c = getContact(params.id);
    if (!c) {
      setNotFound(true);
      return;
    }
    setContact(c);

    // Simulate the line connecting, then start counting.
    const connectTimer = setTimeout(() => {
      setPhase("active");
      startedAtRef.current = Date.now();
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }, 2000);

    return () => {
      clearTimeout(connectTimer);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [params.id]);

  function endCall() {
    if (endedRef.current || !contact) return;
    endedRef.current = true;
    if (tickRef.current) clearInterval(tickRef.current);
    const completed = phase === "active" && seconds > 0;
    addCall({
      contactId: contact.id,
      name: contact.name,
      phone: contact.phone,
      type,
      outcome: completed ? "completed" : "cancelled",
      startedAt: startedAtRef.current || Date.now(),
      duration: seconds,
    });
    router.replace("/chats");
  }

  if (notFound) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-[#0f2b2e] text-white">
        <p className="text-white/70">Contact not found.</p>
        <Link href="/contacts" className="font-semibold text-teal">Back to contacts</Link>
      </div>
    );
  }
  if (!contact) return null;

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-between bg-gradient-to-b from-teal to-[#0f3a3e] px-6 py-16 text-white">
      <div className="flex flex-col items-center gap-4 pt-10">
        <Avatar name={contact.name} size={120} />
        <h1 className="text-2xl font-bold">{contact.name}</h1>
        <p className="text-sm text-white/80">
          {phase === "connecting"
            ? `${type === "video" ? "Video" : "Voice"} call · connecting…`
            : formatDuration(seconds)}
        </p>
      </div>

      {type === "video" && (
        <p className="text-xs text-white/50">Camera preview not available in this demo</p>
      )}

      <div className="flex items-center gap-10">
        <button
          onClick={endCall}
          aria-label="End call"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg transition-transform hover:scale-105"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(135deg)" }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
