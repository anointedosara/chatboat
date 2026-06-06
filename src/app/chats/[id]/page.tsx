"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import VoiceMessage from "@/components/VoiceMessage";
import ConfirmDialog from "@/components/ConfirmDialog";
import { blockUser, getContact, getContacts, isBlocked, unblockUser } from "@/lib/store";
import { getCurrentUser } from "@/lib/users";
import {
  deleteChat,
  fetchMessages,
  sendMessage,
  uploadFile,
  type ChatMessage,
} from "@/lib/chatClient";
import { startCall } from "@/lib/callClient";

function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDuration(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function formatSize(bytes = 0): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type Target = { peer: string; name: string; contactId: string };

function resolveTarget(id: string): Target | null {
  const byId = getContact(id);
  if (byId) return { peer: byId.phone, name: byId.name, contactId: byId.id };
  if (/^\d{8,15}$/.test(id)) {
    const c = getContacts().find((x) => x.phone === id);
    return { peer: id, name: c?.name ?? `+${id}`, contactId: c?.id ?? id };
  }
  return null;
}

export default function ConversationPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [self, setSelf] = useState<string>("");
  const [target, setTarget] = useState<Target | null>(null);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "block" | "delete">(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef<string>("");

  // Recording
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setSelf(u.phone);
    const t = resolveTarget(id);
    setTarget(t);
    if (t) setBlocked(isBlocked(t.peer));
    setReady(true);
  }, [id, router]);

  const refresh = useCallback(async () => {
    if (!self || !target) return;
    const list = await fetchMessages(self, target.peer, 0);
    const lastId = list.length ? list[list.length - 1].id : "";
    if (lastId !== lastIdRef.current) {
      lastIdRef.current = lastId;
      setMessages(list);
    }
  }, [self, target]);

  // Initial load + polling.
  useEffect(() => {
    if (!self || !target) return;
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [self, target, refresh]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendText() {
    const text = draft.trim();
    if (!text || !self || !target) return;
    setDraft("");
    await sendMessage({ from: self, to: target.peer, type: "text", text });
    refresh();
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !self || !target) return;
    setBusy(true);
    const up = await uploadFile(file);
    setBusy(false);
    if (!up.ok || !up.url) {
      setMicError(up.error === "too_large" ? "File is too large (max 8 MB)." : "Upload failed.");
      return;
    }
    await sendMessage({
      from: self,
      to: target.peer,
      type: "file",
      fileUrl: up.url,
      fileName: up.name,
      fileType: up.type,
      fileSize: up.size,
    });
    refresh();
  }

  async function startRecording() {
    if (!self || !target) return;
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      cancelledRef.current = false;
      rec.ondataavailable = (ev) => ev.data.size > 0 && chunksRef.current.push(ev.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        const seconds = Math.max(1, elapsedRef.current);
        setRecording(false);
        setElapsed(0);
        if (cancelledRef.current || chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const file = new File([blob], "voice-note.webm", { type: blob.type });
        const up = await uploadFile(file);
        if (!up.ok || !up.url) return;
        await sendMessage({
          from: self,
          to: target.peer,
          type: "voice",
          fileUrl: up.url,
          fileName: up.name,
          fileType: up.type,
          fileSize: up.size,
          duration: seconds,
        });
        refresh();
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setElapsed(0);
      elapsedRef.current = 0;
      recTimerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
    } catch {
      setMicError("Microphone permission is needed to record voice notes.");
    }
  }

  function stopRecording(cancel: boolean) {
    cancelledRef.current = cancel;
    recorderRef.current?.stop();
  }

  function doBlock() {
    if (!target) return;
    blockUser(target.peer);
    setBlocked(true);
    setConfirm(null);
    setMenuOpen(false);
  }

  function doUnblock() {
    if (!target) return;
    unblockUser(target.peer);
    setBlocked(false);
  }

  async function doDeleteChat() {
    if (!self || !target) return;
    await deleteChat(self, target.peer);
    setConfirm(null);
    router.push("/chats");
  }

  async function placeCall(type: "voice" | "video") {
    if (!self || !target) return;
    const me = getCurrentUser();
    const callId = await startCall(self, target.peer, type, me?.name ?? "");
    router.push(`/call/${target.peer}?role=caller&callId=${callId}&type=${type}`);
  }

  if (!ready) return null;
  if (!target) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-white">
        <p className="text-ink/60">This conversation could not be found.</p>
        <Link href="/chats" className="font-semibold text-teal-dark">Back to chats</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#d9efe9]">
      {/* Header */}
      <header className="flex items-center gap-3 bg-teal px-3 py-3 text-white">
        <button aria-label="Back" onClick={() => router.push("/chats")} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <Link href={`/contacts/${target.contactId}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={target.name} size={38} />
          <span className="truncate text-lg font-semibold">{target.name}</span>
        </Link>
        <button aria-label="Voice call" onClick={() => placeCall("voice")} className="p-1.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
          </svg>
        </button>
        <button aria-label="Video call" onClick={() => placeCall("video")} className="p-1.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="m23 7-7 5 7 5V7Z" /><rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        </button>
        <div className="relative">
          <button aria-label="More options" onClick={() => setMenuOpen((o) => !o)} className="p-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl bg-white py-1 text-sm text-ink shadow-xl">
                <Link href={`/contacts/${target.contactId}`} className="block px-4 py-2.5 hover:bg-black/5">
                  View profile
                </Link>
                {blocked ? (
                  <button onClick={() => { doUnblock(); setMenuOpen(false); }} className="block w-full px-4 py-2.5 text-left hover:bg-black/5">
                    Unblock
                  </button>
                ) : (
                  <button onClick={() => { setMenuOpen(false); setConfirm("block"); }} className="block w-full px-4 py-2.5 text-left hover:bg-black/5">
                    Block
                  </button>
                )}
                <button onClick={() => { setMenuOpen(false); setConfirm("delete"); }} className="block w-full px-4 py-2.5 text-left text-red-500 hover:bg-black/5">
                  Delete chat
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4">
        {messages.length === 0 ? (
          <div className="m-auto text-center text-sm text-ink/40">Say hi to {target.name} 👋</div>
        ) : (
          <div className="mx-auto mb-2 rounded-full bg-white/70 px-3 py-1 text-xs text-ink/60">Today</div>
        )}
        {messages.map((m) => {
          const mine = m.from === self;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-2.5 py-2 text-sm shadow-sm ${
                  mine ? "rounded-br-sm bg-[#bdeee0] text-ink" : "rounded-bl-sm bg-white text-ink"
                }`}
              >
                <MessageBody m={m} mine={mine} />
                <span className="mt-0.5 block text-right text-[10px] text-ink/40">{clockTime(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {micError && <p className="bg-red-50 px-4 py-2 text-center text-xs text-red-500">{micError}</p>}

      {/* Composer (hidden while blocked) */}
      {blocked ? (
        <div className="flex flex-col items-center gap-2 bg-white px-4 py-4 text-center">
          <p className="text-sm text-ink/60">You blocked {target.name}. Unblock to send messages.</p>
          <button onClick={doUnblock} className="rounded-full bg-teal px-6 py-2 text-sm font-semibold text-white hover:bg-teal-dark">
            Unblock
          </button>
        </div>
      ) : recording ? (
        <div className="flex items-center gap-3 px-3 py-3">
          <button onClick={() => stopRecording(true)} aria-label="Cancel" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6" />
            </svg>
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm text-ink/70">Recording… {formatDuration(elapsed)}</span>
          </div>
          <button onClick={() => stopRecording(false)} aria-label="Send recording" className="flex h-11 w-11 items-center justify-center rounded-full bg-teal text-white shadow-sm hover:bg-teal-dark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Message"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
            />
            <button onClick={() => fileInputRef.current?.click()} aria-label="Attach file" disabled={busy} className="text-ink/40 disabled:opacity-50">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          </div>
          <input ref={fileInputRef} type="file" onChange={onPickFile} className="hidden" />
          <button
            aria-label={draft.trim() ? "Send" : "Record voice note"}
            onClick={() => (draft.trim() ? sendText() : startRecording())}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white shadow-sm transition-colors hover:bg-teal-dark"
          >
            {draft.trim() ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
              </svg>
            )}
          </button>
        </div>
      )}

      {confirm === "block" && (
        <ConfirmDialog
          title={`Block ${target.name}?`}
          message="You won't be able to send or receive messages from this contact until you unblock them."
          confirmLabel="Block"
          danger
          onConfirm={doBlock}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "delete" && (
        <ConfirmDialog
          title="Delete this chat?"
          message="This permanently removes all messages in this conversation for both of you."
          confirmLabel="Delete"
          danger
          onConfirm={doDeleteChat}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function MessageBody({ m, mine }: { m: ChatMessage; mine: boolean }) {
  if (m.type === "voice" && m.fileUrl) {
    return <VoiceMessage src={m.fileUrl} duration={m.duration ?? 0} mine={mine} />;
  }
  if (m.type === "file" && m.fileUrl) {
    const isImage = (m.fileType ?? "").startsWith("image/");
    if (isImage) {
      return (
        <a href={m.fileUrl} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.fileUrl} alt={m.fileName ?? "image"} className="max-h-60 rounded-lg object-cover" />
        </a>
      );
    }
    return (
      <a
        href={m.fileUrl}
        download={m.fileName}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2.5 py-0.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block max-w-[150px] truncate font-medium">{m.fileName ?? "file"}</span>
          <span className="block text-[11px] text-ink/50">{formatSize(m.fileSize)}</span>
        </span>
      </a>
    );
  }
  return <span className="whitespace-pre-wrap break-words">{m.text}</span>;
}
