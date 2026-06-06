import { NextRequest } from "next/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { getSignals, pushSignal } from "@/lib/server/signaling";
import type { Signal, SignalType } from "@/lib/callTypes";

const TYPES: SignalType[] = [
  "invite",
  "accept",
  "decline",
  "offer",
  "answer",
  "ice",
  "hangup",
  "cancel",
];

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const self = normalizePhone(sp.get("self") ?? "");
  const since = Number(sp.get("since") ?? "0") || 0;
  if (!isValidPhone(self)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  const signals = await getSignals(self, since);
  const cursor = signals.reduce((m, s) => Math.max(m, s.seq ?? 0), since);
  return Response.json({ ok: true, signals, cursor });
}

export async function POST(request: NextRequest) {
  let body: Partial<Signal>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const from = normalizePhone(body.from ?? "");
  const to = normalizePhone(body.to ?? "");
  if (!isValidPhone(from) || !isValidPhone(to)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  if (!body.type || !TYPES.includes(body.type)) {
    return Response.json({ ok: false, error: "invalid_type" }, { status: 400 });
  }
  if (!body.callId) {
    return Response.json({ ok: false, error: "missing_callId" }, { status: 400 });
  }

  const signal = await pushSignal({
    type: body.type,
    from,
    to,
    callId: body.callId,
    callType: body.callType,
    fromName: body.fromName,
    sdp: body.sdp,
    candidate: body.candidate,
    ts: body.ts ?? Date.now(),
  });

  return Response.json({ ok: true, seq: signal.seq });
}
