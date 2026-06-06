import { NextRequest } from "next/server";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { verifyOtp } from "@/lib/otpStore";

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
  if (!/^\d{4}$/.test(code)) {
    return Response.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  const result = verifyOtp(phone, code);
  if (result.ok) {
    return Response.json({ ok: true });
  }
  // reason: "no_code" | "expired" | "mismatch"
  return Response.json({ ok: false, error: result.reason }, { status: 400 });
}
