import { NextRequest } from "next/server";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import {
  createOtp,
  resendWaitMs,
  RESEND_COOLDOWN_MS,
  OTP_EXPIRY_MS,
} from "@/lib/otpStore";
import { sendSms, SMS_DEV_MODE } from "@/lib/sms";

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

  // Enforce the 1-minute resend cooldown.
  const wait = resendWaitMs(phone);
  if (wait > 0) {
    return Response.json(
      { ok: false, error: "cooldown", retryAfterMs: wait },
      { status: 429 },
    );
  }

  // Creating a new code replaces (invalidates) any previous one.
  const code = createOtp(phone);
  const minutes = Math.round(OTP_EXPIRY_MS / 60000);
  await sendSms(
    phone,
    `Your Chatboat verification code is ${code}. It expires in ${minutes} minutes.`,
  );

  return Response.json({
    ok: true,
    resendAfterMs: RESEND_COOLDOWN_MS,
    expiresInMs: OTP_EXPIRY_MS,
    // Dev convenience only — never returned in production.
    devCode: SMS_DEV_MODE ? code : undefined,
  });
}
