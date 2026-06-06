import { Redis } from "@upstash/redis";
import { normalizePhone } from "@/lib/phone";
import type { Signal } from "@/lib/callTypes";

/**
 * Per-user signaling mailbox for WebRTC call setup.
 *
 * Each recipient has an ordered inbox; the other peer polls it. Backed by
 * Upstash Redis when configured (serverless-safe), with an in-memory fallback
 * for local dev. Entries expire so the mailbox stays small.
 *
 * Scores/cursors are monotonic timestamps (not a resettable counter) so that a
 * client's saved cursor never sits above a fresh signal — otherwise, after the
 * inbox TTL reset, new calls would be skipped until a page refresh.
 */

const TTL_SECONDS = 120;

let lastScore = 0;
function nextScore(): number {
  const t = Date.now();
  lastScore = t > lastScore ? t : lastScore + 1;
  return lastScore;
}

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

function asObj<T>(v: unknown): T {
  return (typeof v === "string" ? JSON.parse(v) : v) as T;
}

type MemBox = { items: Signal[] };
const g = globalThis as unknown as { __cbSig?: Map<string, MemBox> };
const mem: Map<string, MemBox> = g.__cbSig ?? new Map();
g.__cbSig = mem;

export async function pushSignal(input: Omit<Signal, "seq">): Promise<Signal> {
  const to = normalizePhone(input.to);
  const from = normalizePhone(input.from);
  const seq = nextScore();
  const full: Signal = { ...input, from, to, seq };

  const r = redis();
  if (r) {
    await r.zadd(inboxKey(to), { score: seq, member: JSON.stringify(full) });
    await r.expire(inboxKey(to), TTL_SECONDS);
    return full;
  }
  const box = mem.get(to) ?? { items: [] };
  box.items.push(full);
  if (box.items.length > 200) box.items = box.items.slice(-200);
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
