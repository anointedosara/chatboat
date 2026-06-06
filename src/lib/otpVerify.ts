import {
  createOtp,
  resendWaitMs,
  verifyOtp,
} from "@/lib/otpStore";

/**
 * OTP delivery + verification.
 *
 * - When Twilio Verify env vars are present, codes are sent and verified by
 *   Twilio. Twilio keeps the state, so this works on serverless (Vercel) with
 *   no shared store of our own.
 * - Otherwise we fall back to "dev mode": a code is generated in-memory and
 *   returned to the client to show on screen (no real SMS).
 *
 * Required env vars for real SMS (set these in Vercel → Project → Settings →
 * Environment Variables, then redeploy):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_VERIFY_SERVICE_SID   (the Verify Service SID, starts with "VA...")
 */

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID,
  );
}

function twilioAuthHeader(): string {
  const token = `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`;
  return `Basic ${Buffer.from(token).toString("base64")}`;
}

function verifyBaseUrl(): string {
  return `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}`;
}

export type StartResult =
  | { ok: true; devCode?: string }
  | { ok: false; error: "cooldown" | "send_failed"; cooldownMs?: number; detail?: string };

/** Send (or trigger sending of) a verification code to a phone (E.164 digits). */
export async function startVerification(phone: string): Promise<StartResult> {
  if (isTwilioConfigured()) {
    const res = await fetch(`${verifyBaseUrl()}/Verifications`, {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: `+${phone}`, Channel: "sms" }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: "send_failed", detail: (data as { message?: string }).message };
  }

  // Dev fallback — enforce the 1-minute resend cooldown locally.
  const wait = resendWaitMs(phone);
  if (wait > 0) return { ok: false, error: "cooldown", cooldownMs: wait };
  const code = createOtp(phone);
  // eslint-disable-next-line no-console
  console.log(`[Chatboat OTP · dev] +${phone} → ${code}`);
  return { ok: true, devCode: code };
}

export type CheckResult =
  | { ok: true }
  | { ok: false; error: "expired" | "mismatch" | "no_code" };

/** Verify a code for a phone (E.164 digits). */
export async function checkVerification(phone: string, code: string): Promise<CheckResult> {
  if (isTwilioConfigured()) {
    const res = await fetch(`${verifyBaseUrl()}/VerificationCheck`, {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: `+${phone}`, Code: code }),
    });
    const data = (await res.json().catch(() => ({}))) as { status?: string };
    if (res.ok && data.status === "approved") return { ok: true };
    // 404 → no pending verification (expired, already used, or too many tries).
    if (res.status === 404) return { ok: false, error: "expired" };
    return { ok: false, error: "mismatch" };
  }

  const result = verifyOtp(phone, code);
  return result.ok ? { ok: true } : { ok: false, error: result.reason };
}
