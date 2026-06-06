import { NextRequest } from "next/server";
import { putFile } from "@/lib/server/chatStore";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ ok: false, error: "too_large" }, { status: 413 });
  }

  const data = await file.arrayBuffer();
  const id = putFile({
    name: file.name || "file",
    type: file.type || "application/octet-stream",
    size: file.size,
    data,
  });

  return Response.json({
    ok: true,
    id,
    name: file.name,
    type: file.type,
    size: file.size,
  });
}
