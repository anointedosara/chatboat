import { normalizePhone } from "@/lib/phone";

/**
 * In-memory server store for messages and uploaded files.
 *
 * Dev-grade: state lives in this Node process, so it resets on a full server
 * restart and is NOT shared across multiple serverless instances. For real
 * cross-device delivery this should move to a database + a realtime transport
 * (WebSockets / Pusher / Supabase). Kept on globalThis to survive HMR.
 */

export type ServerMessage = {
  id: string;
  room: string;
  from: string; // sender phone (normalized)
  to: string; // recipient phone (normalized)
  type: "text" | "voice" | "file";
  text?: string;
  fileId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  duration?: number; // voice length, seconds
  createdAt: number;
};

export type StoredFile = {
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
};

type ChatState = {
  messages: ServerMessage[];
  files: Map<string, StoredFile>;
};

const g = globalThis as unknown as { __chatboatChat?: ChatState };
const state: ChatState = g.__chatboatChat ?? { messages: [], files: new Map() };
g.__chatboatChat = state;

export function uid(prefix = ""): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** A stable room id for an unordered pair of phone numbers. */
export function roomId(a: string, b: string): string {
  return [normalizePhone(a), normalizePhone(b)].sort().join("__");
}

export function addMessage(
  msg: Omit<ServerMessage, "id" | "room" | "createdAt"> & { createdAt?: number },
): ServerMessage {
  const from = normalizePhone(msg.from);
  const to = normalizePhone(msg.to);
  const full: ServerMessage = {
    ...msg,
    from,
    to,
    room: roomId(from, to),
    id: uid("m_"),
    createdAt: msg.createdAt ?? Date.now(),
  };
  state.messages.push(full);
  return full;
}

/** Messages in a room created strictly after `since`. */
export function getRoomMessages(self: string, peer: string, since = 0): ServerMessage[] {
  const room = roomId(self, peer);
  return state.messages
    .filter((m) => m.room === room && m.createdAt > since)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export type ConversationSummary = {
  peer: string;
  lastType: ServerMessage["type"];
  lastText?: string;
  lastFrom: string;
  lastTime: number;
};

/** One entry per peer the user has exchanged messages with. */
export function getConversationsFor(self: string): ConversationSummary[] {
  const me = normalizePhone(self);
  const byPeer = new Map<string, ServerMessage>();
  for (const m of state.messages) {
    if (m.from !== me && m.to !== me) continue;
    const peer = m.from === me ? m.to : m.from;
    const prev = byPeer.get(peer);
    if (!prev || m.createdAt > prev.createdAt) byPeer.set(peer, m);
  }
  return Array.from(byPeer.entries())
    .map(([peer, m]) => ({
      peer,
      lastType: m.type,
      lastText: m.text,
      lastFrom: m.from,
      lastTime: m.createdAt,
    }))
    .sort((a, b) => b.lastTime - a.lastTime);
}

/** Delete all messages between two users (delete a chat). */
export function deleteRoom(self: string, peer: string): void {
  const room = roomId(self, peer);
  state.messages = state.messages.filter((m) => m.room !== room);
}

/** Delete every message involving a user (account deletion). */
export function deleteAllFor(self: string): void {
  const me = normalizePhone(self);
  state.messages = state.messages.filter((m) => m.from !== me && m.to !== me);
}

export function putFile(file: StoredFile): string {
  const id = uid("f_");
  state.files.set(id, file);
  return id;
}

export function getFile(id: string): StoredFile | undefined {
  return state.files.get(id);
}
