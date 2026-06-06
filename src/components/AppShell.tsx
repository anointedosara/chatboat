"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ChatLogo from "@/components/ChatLogo";
import { getCurrentUser } from "@/lib/users";
import { publishProfile } from "@/lib/profileClient";

type Tab = "chats" | "contacts" | "settings";

const NAV: { key: Tab; label: string; href: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    key: "chats",
    label: "Chats",
    href: "/chats",
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
      </svg>
    ),
  },
  {
    key: "contacts",
    label: "Contacts",
    href: "/contacts",
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
];

/**
 * App chrome for the signed-in screens.
 *  - Mobile: a bottom tab bar.
 *  - From 768px: a left sidebar; content fills the rest of the screen.
 */
export default function AppShell({
  active,
  children,
}: {
  active: Tab;
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Block access to the signed-in screens when there's no session, and keep
  // this user's shared profile (name + avatar) published for other users.
  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    publishProfile(u);
  }, [router]);

  return (
    <div className="flex min-h-dvh w-full bg-white">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-teal px-4 py-6 text-white md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <ChatLogo size={30} />
          <span className="text-xl font-bold tracking-wide">Chatboat</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive ? "bg-white text-teal-dark" : "text-white/90 hover:bg-white/10"
                }`}
              >
                {item.icon(isActive)}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content + mobile bottom nav */}
      <div className="flex min-h-dvh flex-1 flex-col">
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>

        <nav className="flex shrink-0 border-t border-black/5 bg-white md:hidden">
          {NAV.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  isActive ? "text-teal" : "text-ink/50"
                }`}
              >
                {item.icon(isActive)}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
