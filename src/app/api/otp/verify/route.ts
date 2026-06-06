import { NextRequest } from "next/server";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { OTP_LENGTH } from "@/lib/otpConfig";
import { checkVerification } from "@/lib/otpVerify";

export async function POST(request: NextRequest) {
  let body: { phone?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  const code = (body.code ?? "").trim();

  if (!isValidPhone(phone)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) {
    return Response.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  const result = await checkVerification(phone, code);
  if (result.ok) {
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, error: result.error }, { status: 400 });
}
