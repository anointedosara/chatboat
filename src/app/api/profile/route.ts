import { NextRequest } from "next/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { getProfiles, saveProfile } from "@/lib/server/db";

// Cap the stored avatar so the profile store stays small (~a resized data URL).
const MAX_AVATAR_CHARS = 200_000;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const raw = sp.get("phones") ?? sp.get("phone") ?? "";
  const phones = raw
    .split(",")
    .map((p) => normalizePhone(p))
    .filter(isValidPhone);
  const profiles = await getProfiles(phones);
  return Response.json({ ok: true, profiles });
}

export async function POST(request: NextRequest) {
  let body: { phone?: string; name?: string; avatar?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  if (!isValidPhone(phone)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }

  const avatar =
    body.avatar && body.avatar.length <= MAX_AVATAR_CHARS ? body.avatar : undefined;

  await saveProfile(phone, { name: body.name?.trim(), avatar });
  return Response.json({ ok: true });
}
