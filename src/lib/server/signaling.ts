import { Redis } from "@upstash/redis";
import { normalizePhone } from "@/lib/phone";
import type { Signal } from "@/lib/callTypes";

/**
 * Per-user signaling mailbox for WebRTC call setup.
 *
 * Each recipient has an ordered inbox; the other peer polls it. Backed by
 * Upstash Redis when configured (serverless-safe), with an in-memory fallback
 * for local dev. Entries expire so the mailbox stays small.
 */

const TTL_SECONDS = 120;

let redisClient: Redis | null = null;
function redis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    redisClient = new Redis({ url, token });
    return redisClient;
  }
  return null;
}

const inboxKey = (p: string) => `cb:sig:${p}`;
const seqKey = (p: string) => `cb:sigseq:${p}`;

function asObj<T>(v: unknown): T {
  return (typeof v === "string" ? JSON.parse(v) : v) as T;
}

type MemBox = { seq: number; items: Signal[] };
const g = globalThis as unknown as { __cbSig?: Map<string, MemBox> };
const mem: Map<string, MemBox> = g.__cbSig ?? new Map();
g.__cbSig = mem;

export async function pushSignal(input: Omit<Signal, "seq">): Promise<Signal> {
  const to = normalizePhone(input.to);
  const from = normalizePhone(input.from);
  const r = redis();
  if (r) {
    const seq = await r.incr(seqKey(to));
    const full: Signal = { ...input, from, to, seq };
    await r.zadd(inboxKey(to), { score: seq, member: JSON.stringify(full) });
    await r.expire(inboxKey(to), TTL_SECONDS);
    await r.expire(seqKey(to), TTL_SECONDS);
    return full;
  }
  const box = mem.get(to) ?? { seq: 0, items: [] };
  box.seq += 1;
  const full: Signal = { ...input, from, to, seq: box.seq };
  box.items.push(full);
  // keep only the most recent 100 entries
  if (box.items.length > 100) box.items = box.items.slice(-100);
  mem.set(to, box);
  return full;
}

export async function getSignals(self: string, since = 0): Promise<Signal[]> {
  const me = normalizePhone(self);
  const r = redis();
  if (r) {
    const raw = await r.zrange<unknown[]>(inboxKey(me), since, "+inf", { byScore: true });
    return raw.map((x) => asObj<Signal>(x)).filter((s) => (s.seq ?? 0) > since);
  }
  const box = mem.get(me);
  if (!box) return [];
  return box.items.filter((s) => (s.seq ?? 0) > since);
}
