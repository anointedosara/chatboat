"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { getBlocked, getContacts, unblockUser } from "@/lib/store";

export default function BlockedUsersPage() {
  const router = useRouter();
  const [blocked, setBlocked] = useState<string[]>([]);

  const refresh = useCallback(() => setBlocked(getBlocked()), []);
  useEffect(() => refresh(), [refresh]);

  function nameFor(phone: string): string {
    return getContacts().find((c) => c.phone === phone)?.name ?? `+${phone}`;
  }

  function unblock(phone: string) {
    unblockUser(phone);
    refresh();
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#f4f6f7]">
      <header className="flex items-center gap-3 bg-teal px-4 py-4 text-white">
        <button aria-label="Back" onClick={() => router.back()} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Blocked users</h1>
      </header>

      {blocked.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <p className="text-sm text-ink/50">You haven&apos;t blocked anyone.</p>
        </div>
      ) : (
        <ul className="p-4">
          {blocked.map((phone) => (
            <li
              key={phone}
              className="mb-2 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
            >
              <Avatar name={nameFor(phone)} size={42} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{nameFor(phone)}</span>
                <span className="block text-xs text-ink/45">+{phone}</span>
              </span>
              <button
                onClick={() => unblock(phone)}
                className="rounded-full border border-teal px-4 py-1.5 text-sm font-semibold text-teal-dark hover:bg-mint"
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
