"use client";

import { getCurrentUser } from "./users";
import { normalizePhone } from "./phone";

/** Per-user app data, persisted in localStorage keyed by the signed-in phone. */

export type Contact = {
  id: string;
  name: string;
  phone: string; // normalized digits
  createdAt: number;
};

export type Message = {
  id: string;
  from: "me" | "them";
  time: number;
  type: "text" | "voice";
  text?: string;
  audioId?: string; // IndexedDB key for voice notes
  duration?: number; // voice length, seconds
};

export type Conversation = {
  id: string; // == contact id
  contactId: string;
  name: string;
  phone: string;
  messages: Message[];
  updatedAt: number;
};

export type CallLog = {
  id: string;
  contactId: string;
  name: string;
  phone: string;
  type: "voice" | "video";
  outcome: "completed" | "missed" | "cancelled";
  startedAt: number;
  duration: number; // seconds
};

export type AppData = {
  contacts: Contact[];
  conversations: Conversation[];
  calls: CallLog[];
};

const EMPTY: AppData = { contacts: [], conversations: [], calls: [] };
const EVENT = "chatboat:data";

export function uid(prefix = ""): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function keyForCurrent(): string | null {
  const u = getCurrentUser();
  return u ? `chatboat:data:${u.phone}` : null;
}

export function loadData(): AppData {
  if (typeof window === "undefined") return { ...EMPTY };
  const key = keyForCurrent();
  if (!key) return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      contacts: parsed.contacts ?? [],
      conversations: parsed.conversations ?? [],
      calls: parsed.calls ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function saveData(data: AppData): void {
  const key = keyForCurrent();
  if (!key) return;
  window.localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event(EVENT));
}

/** Subscribe to data changes (same tab). Returns an unsubscribe fn. */
export function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("focus", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("focus", cb);
  };
}

/* ---------- Contacts ---------- */

export function getContacts(): Contact[] {
  return loadData().contacts.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function getContact(id: string): Contact | undefined {
  return loadData().contacts.find((c) => c.id === id);
}

/** Add one or more contacts, de-duplicating by phone number. */
export function addContacts(
  incoming: { name: string; phone: string }[],
): Contact[] {
  const data = loadData();
  const byPhone = new Map(data.contacts.map((c) => [c.phone, c]));
  for (const item of incoming) {
    const phone = normalizePhone(item.phone);
    if (!phone) continue;
    const name = item.name.trim() || `+${phone}`;
    if (byPhone.has(phone)) {
      byPhone.get(phone)!.name = name;
    } else {
      const c: Contact = { id: uid("c_"), name, phone, createdAt: Date.now() };
      byPhone.set(phone, c);
    }
  }
  data.contacts = Array.from(byPhone.values());
  saveData(data);
  return data.contacts;
}

/* ---------- Conversations ---------- */

export function getConversations(): Conversation[] {
  return loadData()
    .conversations.filter((c) => c.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): Conversation | undefined {
  return loadData().conversations.find((c) => c.id === id);
}

/** Ensure a conversation exists for a contact (does not persist an empty one). */
export function ensureConversation(contact: Contact): Conversation {
  const data = loadData();
  const existing = data.conversations.find((c) => c.id === contact.id);
  if (existing) return existing;
  return {
    id: contact.id,
    contactId: contact.id,
    name: contact.name,
    phone: contact.phone,
    messages: [],
    updatedAt: Date.now(),
  };
}

export function addMessage(
  conv: Conversation,
  msg: Omit<Message, "id" | "time">,
): Message {
  const data = loadData();
  const full: Message = { ...msg, id: uid("m_"), time: Date.now() };
  let target = data.conversations.find((c) => c.id === conv.id);
  if (!target) {
    target = { ...conv, messages: [] };
    data.conversations.push(target);
  }
  target.messages.push(full);
  target.updatedAt = full.time;
  saveData(data);
  return full;
}

/* ---------- Calls ---------- */

export function getCalls(): CallLog[] {
  return loadData().calls.slice().sort((a, b) => b.startedAt - a.startedAt);
}

export function addCall(call: Omit<CallLog, "id">): CallLog {
  const data = loadData();
  const full: CallLog = { ...call, id: uid("call_") };
  data.calls.push(full);
  saveData(data);
  return full;
}

/* ---------- formatting ---------- */

export function clockTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
