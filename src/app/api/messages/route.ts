import { NextRequest } from "next/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import {
  deleteAllFor,
  deleteRoom,
  getRoomMessages,
  saveMessage,
  type ServerMessage,
} from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const self = normalizePhone(sp.get("self") ?? "");
  const peer = normalizePhone(sp.get("peer") ?? "");
  const since = Number(sp.get("since") ?? "0") || 0;

  if (!isValidPhone(self) || !isValidPhone(peer)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  const messages = await getRoomMessages(self, peer, since);
  return Response.json({ ok: true, messages });
}

export async function POST(request: NextRequest) {
  let body: Partial<ServerMessage>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const from = normalizePhone(body.from ?? "");
  const to = normalizePhone(body.to ?? "");
  const type = body.type;

  if (!isValidPhone(from) || !isValidPhone(to)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  if (type !== "text" && type !== "voice" && type !== "file") {
    return Response.json({ ok: false, error: "invalid_type" }, { status: 400 });
  }
  if (type === "text" && !body.text?.trim()) {
    return Response.json({ ok: false, error: "empty_text" }, { status: 400 });
  }
  if ((type === "voice" || type === "file") && !body.fileUrl) {
    return Response.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  const message = await saveMessage({
    from,
    to,
    type,
    text: body.text?.trim(),
    fileUrl: body.fileUrl,
    fileName: body.fileName,
    fileType: body.fileType,
    fileSize: body.fileSize,
    duration: body.duration,
  });

  return Response.json({ ok: true, message });
}

export async function DELETE(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const self = normalizePhone(sp.get("self") ?? "");
  const peer = sp.get("peer") ? normalizePhone(sp.get("peer")!) : "";

  if (!isValidPhone(self)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  if (peer) {
    if (!isValidPhone(peer)) {
      return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
    }
    await deleteRoom(self, peer);
  } else {
    await deleteAllFor(self);
  }
  return Response.json({ ok: true });
}
