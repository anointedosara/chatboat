import { NextRequest } from "next/server";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { RESEND_COOLDOWN_MS, OTP_EXPIRY_MS } from "@/lib/otpStore";
import { startVerification } from "@/lib/otpVerify";

export async function POST(request: NextRequest) {
  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  if (!isValidPhone(phone)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }

  const result = await startVerification(phone);
  if (!result.ok) {
    if (result.error === "cooldown") {
      return Response.json(
        { ok: false, error: "cooldown", retryAfterMs: result.cooldownMs },
        { status: 429 },
      );
    }
    return Response.json(
      { ok: false, error: "send_failed", detail: result.detail },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    resendAfterMs: RESEND_COOLDOWN_MS,
    expiresInMs: OTP_EXPIRY_MS,
    // Only populated in dev mode (no Twilio); never present in production.
    devCode: result.devCode,
  });
}
