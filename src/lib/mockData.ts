/** Static sample data for the chat UI (no backend yet). */

export type ChatPreview = {
  id: string;
  name: string;
  avatar: string; // initials fallback colour handled by component
  time: string;
  preview: string;
  kind?: "text" | "photo" | "video";
  unread?: number;
};

export type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
};

export const CHATS: ChatPreview[] = [
  { id: "devesh", name: "Devesh Ojha", avatar: "DO", time: "18:44", preview: "Hello", kind: "text" },
  { id: "test1", name: "Test 1", avatar: "T1", time: "12:36", preview: "I am done", kind: "text" },
  { id: "sachin", name: "Sachin", avatar: "SA", time: "11:15", preview: "Photo", kind: "photo" },
  { id: "mohit", name: "Mohit tyagi", avatar: "MT", time: "10:00", preview: "Video", kind: "video" },
];

export const CONTACTS: { id: string; name: string; avatar: string }[] = [
  { id: "devesh", name: "Devesh Ojha", avatar: "DO" },
  { id: "sanjay", name: "Sanjay text", avatar: "ST" },
  { id: "mohitj", name: "Mohit jaiswal", avatar: "MJ" },
  { id: "suresh", name: "Suresh nair", avatar: "SN" },
  { id: "alex", name: "Alex dame", avatar: "AD" },
  { id: "stelli", name: "Stelli forte", avatar: "SF" },
  { id: "aman", name: "Aman singh", avatar: "AS" },
  { id: "mohit", name: "Mohit tyagi", avatar: "MT" },
  { id: "joshep", name: "Joshep", avatar: "JO" },
];

export const MESSAGES: Record<string, Message[]> = {
  test1: [
    { id: "1", from: "them", text: "Hi", time: "09:00" },
    { id: "2", from: "me", text: "Hi", time: "09:01" },
    { id: "3", from: "me", text: "How are you?", time: "09:01" },
    { id: "4", from: "me", text: "Hope u r well?", time: "09:02" },
    { id: "5", from: "them", text: "I am done", time: "09:05" },
  ],
};

export function chatById(id: string): ChatPreview | undefined {
  return CHATS.find((c) => c.id === id) ?? CONTACTS.find((c) => c.id === id) as ChatPreview | undefined;
}

export function messagesFor(id: string): Message[] {
  return MESSAGES[id] ?? [];
}

/** Deterministic avatar background colour from initials. */
export function avatarColor(seed: string): string {
  const colors = ["#1fb8c0", "#6c8ee3", "#e07a5f", "#9b5de5", "#2a9d8f", "#f4a261", "#e76f9c"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}
