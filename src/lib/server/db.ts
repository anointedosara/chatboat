import { Redis } from "@upstash/redis";
import { normalizePhone } from "@/lib/phone";

/**
 * Message + conversation persistence.
 *
 * - Uses Upstash Redis when configured (serverless-safe, works on Vercel).
 * - Falls back to an in-memory store when not configured, so local dev works
 *   with no setup. The in-memory store resets on restart and is per-process.
 *
 * Required env vars for production (Vercel → add the Upstash integration, or
 * set these manually, then redeploy):
 *   UPSTASH_REDIS_REST_URL    (or KV_REST_API_URL)
 *   UPSTASH_REDIS_REST_TOKEN  (or KV_REST_API_TOKEN)
 */

export type ServerMessage = {
  id: string;
  room: string;
  from: string;
  to: string;
  type: "text" | "voice" | "file";
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  duration?: number;
  createdAt: number;
};

export type ConversationSummary = {
  peer: string;
  lastType: ServerMessage["type"];
  lastText?: string;
  lastFrom: string;
  lastTime: number;
};

export function uid(prefix = ""): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function roomId(a: string, b: string): string {
  return [normalizePhone(a), normalizePhone(b)].sort().join("__");
}

/* ---------- Redis backend ---------- */

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

const roomKey = (room: string) => `cb:room:${room}`;
const convKey = (phone: string) => `cb:conv:${phone}`;

function asObj<T>(v: unknown): T {
  return (typeof v === "string" ? JSON.parse(v) : v) as T;
}

function summaryFor(m: ServerMessage, peer: string): ConversationSummary {
  return {
    peer,
    lastType: m.type,
    lastText: m.text,
    lastFrom: m.from,
    lastTime: m.createdAt,
  };
}

/* ---------- In-memory fallback ---------- */

type MemState = { messages: ServerMessage[]; profiles: Record<string, Profile> };
const g = globalThis as unknown as { __cbDb?: MemState };
const mem: MemState = g.__cbDb ?? { messages: [], profiles: {} };
mem.profiles ??= {};
g.__cbDb = mem;

/* ---------- Public profiles (name + avatar, shared with other users) ---------- */

export type Profile = { name?: string; avatar?: string; updatedAt: number };
const profilesKey = "cb:profiles";

export async function saveProfile(
  phone: string,
  input: { name?: string; avatar?: string },
): Promise<void> {
  const key = normalizePhone(phone);
  const profile: Profile = {
    name: input.name,
    avatar: input.avatar,
    updatedAt: Date.now(),
  };
  const r = redis();
  if (r) {
    await r.hset(profilesKey, { [key]: JSON.stringify(profile) });
  } else {
    mem.profiles[key] = profile;
  }
}

export async function getProfiles(phones: string[]): Promise<Record<string, Profile>> {
  const keys = phones.map(normalizePhone).filter(Boolean);
  if (keys.length === 0) return {};
  const out: Record<string, Profile> = {};
  const r = redis();
  if (r) {
    const values = await Promise.all(keys.map((k) => r.hget<unknown>(profilesKey, k)));
    keys.forEach((k, i) => {
      const v = values[i];
      if (v) out[k] = asObj<Profile>(v);
    });
  } else {
    keys.forEach((k) => {
      if (mem.profiles[k]) out[k] = mem.profiles[k];
    });
  }
  return out;
}

/* ---------- Public API (async) ---------- */

export async function saveMessage(
  input: Omit<ServerMessage, "id" | "room" | "createdAt"> & { createdAt?: number },
): Promise<ServerMessage> {
  const from = normalizePhone(input.from);
  const to = normalizePhone(input.to);
  const msg: ServerMessage = {
    ...input,
    from,
    to,
    room: roomId(from, to),
    id: uid("m_"),
    createdAt: input.createdAt ?? Date.now(),
  };

  const r = redis();
  if (r) {
    await r.zadd(roomKey(msg.room), { score: msg.createdAt, member: JSON.stringify(msg) });
    await r.hset(convKey(from), { [to]: JSON.stringify(summaryFor(msg, to)) });
    await r.hset(convKey(to), { [from]: JSON.stringify(summaryFor(msg, from)) });
  } else {
    mem.messages.push(msg);
  }
  return msg;
}

export async function getRoomMessages(
  self: string,
  peer: string,
  since = 0,
): Promise<ServerMessage[]> {
  const room = roomId(self, peer);
  const r = redis();
  if (r) {
    const raw = await r.zrange<unknown[]>(roomKey(room), since, "+inf", { byScore: true });
    return raw
      .map((x) => asObj<ServerMessage>(x))
      .filter((m) => m.createdAt > since)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
  return mem.messages
    .filter((m) => m.room === room && m.createdAt > since)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getConversations(self: string): Promise<ConversationSummary[]> {
  const me = normalizePhone(self);
  const r = redis();
  if (r) {
    const map = (await r.hgetall<Record<string, unknown>>(convKey(me))) ?? {};
    return Object.values(map)
      .map((v) => asObj<ConversationSummary>(v))
      .sort((a, b) => b.lastTime - a.lastTime);
  }
  const byPeer = new Map<string, ServerMessage>();
  for (const m of mem.messages) {
    if (m.from !== me && m.to !== me) continue;
    const peer = m.from === me ? m.to : m.from;
    const prev = byPeer.get(peer);
    if (!prev || m.createdAt > prev.createdAt) byPeer.set(peer, m);
  }
  return Array.from(byPeer.entries())
    .map(([peer, m]) => summaryFor(m, peer))
    .sort((a, b) => b.lastTime - a.lastTime);
}

export async function deleteRoom(self: string, peer: string): Promise<void> {
  const me = normalizePhone(self);
  const other = normalizePhone(peer);
  const room = roomId(me, other);
  const r = redis();
  if (r) {
    await r.del(roomKey(room));
    await r.hdel(convKey(me), other);
    await r.hdel(convKey(other), me);
  } else {
    mem.messages = mem.messages.filter((m) => m.room !== room);
  }
}

export async function deleteAllFor(self: string): Promise<void> {
  const me = normalizePhone(self);
  const r = redis();
  if (r) {
    const peers = await r.hkeys(convKey(me));
    for (const peer of peers) {
      await r.del(roomKey(roomId(me, peer)));
      await r.hdel(convKey(peer), me);
    }
    await r.del(convKey(me));
  } else {
    mem.messages = mem.messages.filter((m) => m.from !== me && m.to !== me);
  }
}
