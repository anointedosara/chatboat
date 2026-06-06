"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import {
  clockTime,
  formatDuration,
  getBlocked,
  getCalls,
  getContacts,
  subscribe,
  type CallLog,
  type Contact,
} from "@/lib/store";
import { getCurrentUser } from "@/lib/users";
import { fetchConversations, type ConversationSummary } from "@/lib/chatClient";
import { fetchProfiles, type PeerProfile } from "@/lib/profileClient";

function previewText(c: ConversationSummary): string {
  if (c.lastType === "voice") return "🎤 Voice message";
  if (c.lastType === "file") return "📎 Attachment";
  return c.lastText ?? "";
}

export default function ChatsPage() {
  const [tab, setTab] = useState<"chats" | "calls">("chats");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PeerProfile>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [me, setMe] = useState<{ name: string; phone: string; avatar?: string }>({ name: "", phone: "" });

  const refreshLocal = useCallback(() => {
    setCalls(getCalls());
    setContacts(getContacts());
    setBlocked(getBlocked());
    const u = getCurrentUser();
    if (u) setMe({ name: u.name, phone: u.phone, avatar: u.avatar });
  }, []);

  const refreshServer = useCallback(async (phone: string) => {
    if (!phone) return;
    const convs = await fetchConversations(phone);
    setConversations(convs);
    if (convs.length) setProfiles(await fetchProfiles(convs.map((c) => c.peer)));
  }, []);

  useEffect(() => {
    refreshLocal();
    const u = getCurrentUser();
    const phone = u?.phone ?? "";
    refreshServer(phone);
    const t = setInterval(() => refreshServer(phone), 3000);
    const unsub = subscribe(refreshLocal);
    return () => {
      clearInterval(t);
      unsub();
    };
  }, [refreshLocal, refreshServer]);

  const nameFor = useCallback(
    (peer: string) =>
      contacts.find((c) => c.phone === peer)?.name ?? profiles[peer]?.name ?? `+${peer}`,
    [contacts, profiles],
  );

  const filteredChats = useMemo(
    () =>
      conversations.filter((c) => {
        if (blocked.includes(c.peer)) return false;
        const q = query.trim().toLowerCase();
        return nameFor(c.peer).toLowerCase().includes(q) || c.peer.includes(query.trim());
      }),
    [conversations, query, nameFor, blocked],
  );

  return (
    <AppShell active="chats">
      <div className="flex flex-1 flex-col">
        <header className="bg-teal px-4 pb-3 pt-5 text-white">
          <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1.5 shadow-sm">
            {me.avatar ? (
              <Avatar name={me.name} src={me.avatar} size={32} />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-sm font-semibold text-white">
                {me.name ? me.name[0].toUpperCase() : "U"}
              </span>
            )}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, number..."
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
            />
            <svg className="mr-1 text-teal-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          <div className="mt-4 flex gap-8 px-1 text-lg font-semibold">
            <button onClick={() => setTab("chats")} className={tab === "chats" ? "border-b-2 border-white pb-1" : "pb-1 text-white/70"}>
              Chats
            </button>
            <button onClick={() => setTab("calls")} className={tab === "calls" ? "border-b-2 border-white pb-1" : "pb-1 text-white/70"}>
              Calls
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-y-auto bg-white">
          {tab === "calls" ? (
            calls.length === 0 ? (
              <EmptyState text={"No calls yet\nstart a conversation"} />
            ) : (
              <ul>
                {calls.map((c) => (
                  <li key={c.id}>
                    <Link href={`/contacts/${c.contactId}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/3">
                      <Avatar name={c.name} />
                      <span className="min-w-0 flex-1 border-b border-black/5 pb-3">
                        <span className="flex items-center justify-between">
                          <span className={`truncate font-semibold ${c.outcome === "missed" ? "text-red-500" : "text-ink"}`}>{c.name}</span>
                          <span className="ml-2 shrink-0 text-xs text-ink/40">{clockTime(c.startedAt)}</span>
                        </span>
                        <span className="mt-0.5 block text-sm text-ink/50">
                          {c.outcome === "completed"
                            ? `${c.type === "video" ? "Video" : "Voice"} · ${formatDuration(c.duration)}`
                            : c.outcome === "missed" ? "Missed" : "Cancelled"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : filteredChats.length === 0 ? (
            <EmptyState text={"There is no conversion here\nlets have some"} />
          ) : (
            <ul>
              {filteredChats.map((c) => (
                <li key={c.peer}>
                  <Link href={`/chats/${c.peer}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/3">
                    <Avatar name={nameFor(c.peer)} src={profiles[c.peer]?.avatar} />
                    <span className="min-w-0 flex-1 border-b border-black/5 pb-3">
                      <span className="flex items-center justify-between">
                        <span className="truncate font-semibold text-ink">{nameFor(c.peer)}</span>
                        <span className="ml-2 shrink-0 text-xs text-ink/40">{clockTime(c.lastTime)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink/50">
                        {c.lastFrom === me.phone ? "You: " : ""}
                        {previewText(c)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/contacts"
            aria-label="New chat"
            className="fixed bottom-20 right-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-white shadow-lg transition-colors hover:bg-teal-dark md:absolute md:bottom-6"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-20 text-center">
      <p className="whitespace-pre-line text-sm leading-6 text-ink/50">{text}</p>
    </div>
  );
}
