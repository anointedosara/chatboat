"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteUser, getCurrentUser } from "@/lib/users";
import { wipeUserData } from "@/lib/store";
import { deleteAllMessages } from "@/lib/chatClient";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setPhone(u.phone);
  }, [router]);

  async function deleteEverything() {
    setBusy(true);
    // 1) server messages/files involving this number
    await deleteAllMessages(phone);
    // 2) this account's local app data (chats meta, contacts, calls, blocked)
    wipeUserData(phone);
    // 3) the account record + current-session pointer
    deleteUser(phone);
    // Can't return to the app — go to register with history replaced.
    router.replace("/register");
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white">
      <header className="flex items-center gap-3 bg-teal px-4 py-4 text-white">
        <button aria-label="Back" onClick={() => router.back()} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Delete account</h1>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6" />
            </svg>
          </span>
          <h2 className="text-xl font-bold text-ink">Delete your account?</h2>
          <p className="text-sm leading-6 text-ink/60">
            This permanently deletes your profile, contacts, chats, calls and blocked
            list from this device, and removes your messages from the server. This action
            cannot be undone.
          </p>
        </div>

        <div className="mt-auto pb-8 pt-10">
          <button
            onClick={() => setConfirming(true)}
            disabled={busy}
            className="w-full rounded-full bg-red-500 py-3.5 text-base font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            Delete my account
          </button>
          <button
            onClick={() => router.back()}
            disabled={busy}
            className="mt-3 w-full rounded-full border border-black/10 py-3.5 text-base font-semibold text-ink/70"
          >
            Cancel
          </button>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Are you sure?"
          message="Your account and everything related to it will be permanently deleted. You cannot undo this."
          confirmLabel={busy ? "Deleting…" : "Yes, delete"}
          danger
          onConfirm={deleteEverything}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
