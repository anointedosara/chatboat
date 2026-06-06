"use client";

export type ChatMessage = {
  id: string;
  room: string;
  from: string;
  to: string;
  type: "text" | "voice" | "file";
  text?: string;
  fileId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  duration?: number;
  createdAt: number;
};

export type UploadResult = {
  ok: boolean;
  id?: string;
  name?: string;
  type?: string;
  size?: number;
  error?: string;
};

export function fileUrl(id: string): string {
  return `/api/files/${id}`;
}

export async function fetchMessages(
  self: string,
  peer: string,
  since = 0,
): Promise<ChatMessage[]> {
  const res = await fetch(
    `/api/messages?self=${self}&peer=${peer}&since=${since}`,
    { cache: "no-store" },
  );
  const data = await res.json();
  return data.ok ? (data.messages as ChatMessage[]) : [];
}

export async function sendMessage(
  body: Omit<ChatMessage, "id" | "room" | "createdAt">,
): Promise<ChatMessage | null> {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.ok ? (data.message as ChatMessage) : null;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/files", { method: "POST", body: form });
  return (await res.json()) as UploadResult;
}

export type ConversationSummary = {
  peer: string;
  lastType: ChatMessage["type"];
  lastText?: string;
  lastFrom: string;
  lastTime: number;
};

export async function fetchConversations(self: string): Promise<ConversationSummary[]> {
  const res = await fetch(`/api/conversations?self=${self}`, { cache: "no-store" });
  const data = await res.json();
  return data.ok ? (data.conversations as ConversationSummary[]) : [];
}
