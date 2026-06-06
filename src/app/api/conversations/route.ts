import { NextRequest } from "next/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { getConversationsFor } from "@/lib/server/chatStore";

export async function GET(request: NextRequest) {
  const self = normalizePhone(request.nextUrl.searchParams.get("self") ?? "");
  if (!isValidPhone(self)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  return Response.json({ ok: true, conversations: getConversationsFor(self) });
}
