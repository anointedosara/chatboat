import { NextRequest } from "next/server";
import { getMemFile } from "@/lib/server/fileStore";

/** Serves files from the in-memory fallback (local dev). In production,
 *  attachments live on Vercel Blob and are fetched from their own URLs. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/files/[id]">) {
  const { id } = await ctx.params;
  const file = getMemFile(id);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(file.data, {
    headers: {
      "Content-Type": file.type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
