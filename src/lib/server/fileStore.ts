import { put } from "@vercel/blob";
import { uid } from "./db";

/**
 * File storage for chat attachments and voice notes.
 *
 * - Uses Vercel Blob when configured (BLOB_READ_WRITE_TOKEN) and returns a
 *   public CDN URL. Set up via Vercel → Storage → Blob, then redeploy.
 * - Falls back to an in-memory store locally, served by /api/files/[id].
 */

export type StoredResult = {
  url: string;
  name: string;
  type: string;
  size: number;
};

type MemFile = { name: string; type: string; size: number; data: ArrayBuffer };
const g = globalThis as unknown as { __cbFiles?: Map<string, MemFile> };
const memFiles: Map<string, MemFile> = g.__cbFiles ?? new Map();
g.__cbFiles = memFiles;

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function storeFile(file: File): Promise<StoredResult> {
  if (isBlobConfigured()) {
    const blob = await put(`chatboat/${uid()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url, name: file.name, type: file.type, size: file.size };
  }
  // In-memory fallback (local dev).
  const id = uid("f_");
  const data = await file.arrayBuffer();
  memFiles.set(id, { name: file.name, type: file.type, size: file.size, data });
  return {
    url: `/api/files/${id}`,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
  };
}

export function getMemFile(id: string): MemFile | undefined {
  return memFiles.get(id);
}
