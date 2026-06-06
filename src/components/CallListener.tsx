"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { getCurrentUser } from "@/lib/users";
import { getContacts } from "@/lib/store";
import { pollSignals, sendSignal } from "@/lib/callClient";

type Incoming = {
  callId: string;
  from: string;
  fromName: string;
  callType: "voice" | "video";
};

/**
 * App-wide listener for incoming calls. Polls the signaling inbox and shows a
 * ringing screen with Accept / Decline. Mounted once in the root layout.
 */
export default function CallListener() {
  const router = useRouter();
  const pathname = usePathname();
  const [incoming, setIncoming] = useState<Incoming | null>(null);

  const cursorRef = useRef(0);
  const selfRef = useRef("");
  const handledRef = useRef<Set<string>>(new Set());
  const onCallRef = useRef(false);
  const incomingRef = useRef<Incoming | null>(null);

  onCallRef.current = pathname?.startsWith("/call") ?? false;
  incomingRef.current = incoming;

  useEffect(() => {
    let alive = true;

    async function tick() {
      const u = getCurrentUser();
      const self = u?.phone ?? "";
      if (!self) return;
      if (self !== selfRef.current) {
        selfRef.current = self;
        cursorRef.current = 0;
      }

      const { signals, cursor } = await pollSignals(self, cursorRef.current);
      if (!alive) return;
      cursorRef.current = cursor;

      for (const s of signals) {
        if (s.type === "invite") {
          const fresh = Date.now() - s.ts < 35000;
          if (
            fresh &&
            !handledRef.current.has(s.callId) &&
            !onCallRef.current &&
            !incomingRef.current
          ) {
            const name =
              getContacts().find((c) => c.phone === s.from)?.name ?? `+${s.from}`;
            const inc: Incoming = {
              callId: s.callId,
              from: s.from,
              fromName: s.fromName || name,
              callType: s.callType ?? "voice",
            };
            incomingRef.current = inc;
            setIncoming(inc);
            navigator.vibrate?.([400, 200, 400]);
          }
        } else if (s.type === "cancel" || s.type === "hangup") {
          if (incomingRef.current?.callId === s.callId) {
            handledRef.current.add(s.callId);
            incomingRef.current = null;
            setIncoming(null);
          }
        }
      }
    }

    const t = setInterval(tick, 1500);
    tick();
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!incoming) return null;

  function accept() {
    if (!incoming) return;
    handledRef.current.add(incoming.callId);
    sendSignal({
      type: "accept",
      from: selfRef.current,
      to: incoming.from,
      callId: incoming.callId,
    });
    const q = `role=callee&callId=${incoming.callId}&type=${incoming.callType}`;
    setIncoming(null);
    incomingRef.current = null;
    router.push(`/call/${incoming.from}?${q}`);
  }

  function decline() {
    if (!incoming) return;
    handledRef.current.add(incoming.callId);
    sendSignal({
      type: "decline",
      from: selfRef.current,
      to: incoming.from,
      callId: incoming.callId,
    });
    setIncoming(null);
    incomingRef.current = null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-linear-to-b from-teal to-[#0f3a3e] px-6 py-16 text-white">
      <div className="flex flex-col items-center gap-4 pt-12">
        <Avatar name={incoming.fromName} size={120} />
        <h1 className="text-2xl font-bold">{incoming.fromName}</h1>
        <p className="text-sm text-white/80">
          Incoming {incoming.callType === "video" ? "video" : "voice"} call…
        </p>
      </div>

      <div className="flex w-full max-w-xs items-center justify-between">
        <button onClick={decline} className="flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(135deg)" }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
          </span>
          <span className="text-sm">Decline</span>
        </button>
        <button onClick={accept} className="flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
          </span>
          <span className="text-sm">Accept</span>
        </button>
      </div>
    </div>
  );
}
