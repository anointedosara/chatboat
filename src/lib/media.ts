"use client";

/** Tiny IndexedDB blob store for voice notes (avoids the localStorage quota). */

const DB_NAME = "chatboat-media";
const STORE = "blobs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  const db = await openDB();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

const urlCache = new Map<string, string>();

/** Resolve a blob id to a cached object URL for playback. */
export async function getBlobURL(id: string): Promise<string | undefined> {
  if (urlCache.has(id)) return urlCache.get(id);
  const blob = await getBlob(id);
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}
