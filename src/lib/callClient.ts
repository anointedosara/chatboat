"use client";

import type { Signal } from "@/lib/callTypes";

export function newCallId(): string {
  return "call_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function sendSignal(sig: Omit<Signal, "seq" | "ts">): Promise<void> {
  await fetch("/api/call/signal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sig, ts: Date.now() }),
  });
}

export async function pollSignals(
  self: string,
  since: number,
): Promise<{ signals: Signal[]; cursor: number }> {
  const res = await fetch(`/api/call/signal?self=${self}&since=${since}`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data.ok
    ? { signals: data.signals as Signal[], cursor: data.cursor as number }
    : { signals: [], cursor: since };
}

export async function getIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch("/api/call/ice", { cache: "no-store" });
    const data = await res.json();
    return (data.iceServers as RTCIceServer[]) ?? [];
  } catch {
    return [{ urls: "stun:stun.l.google.com:19302" }];
  }
}

/** Caller: announce a new call to the peer and return the call id. */
export async function startCall(
  self: string,
  peer: string,
  callType: "voice" | "video",
  fromName: string,
): Promise<string> {
  const callId = newCallId();
  await sendSignal({ type: "invite", from: self, to: peer, callId, callType, fromName });
  return callId;
}
