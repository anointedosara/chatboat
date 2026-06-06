import { NextRequest } from "next/server";
import { getFile } from "@/lib/server/chatStore";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/files/[id]">) {
  const { id } = await ctx.params;
  const file = getFile(id);
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
