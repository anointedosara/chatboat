import { NextRequest } from "next/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { getConversations } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const self = normalizePhone(request.nextUrl.searchParams.get("self") ?? "");
  if (!isValidPhone(self)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  const conversations = await getConversations(self);
  return Response.json({ ok: true, conversations });
}
