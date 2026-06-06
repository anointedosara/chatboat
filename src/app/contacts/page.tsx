"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { addContacts, getContacts, subscribe, type Contact } from "@/lib/store";
import { isValidNational } from "@/lib/phone";
import { pickDeviceContacts, supportsDeviceContacts } from "@/lib/deviceContacts";

export default function ContactsPage() {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(() => setContacts(getContacts()), []);

  useEffect(() => {
    refresh();
    return subscribe(refresh);
  }, [refresh]);

  const list = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()) || c.phone.includes(query.trim())),
    [contacts, query],
  );

  return (
    <AppShell active="contacts">
      <div className="flex flex-1 flex-col">
        <header className="bg-teal px-4 pb-4 pt-5 text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Contacts</h1>
            <button onClick={() => setAdding(true)} aria-label="Add contact" className="rounded-full p-1 hover:bg-white/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
            <svg className="text-teal-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, number..."
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
            />
          </div>
        </header>

        {list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="whitespace-pre-line text-sm leading-6 text-ink/50">
              {contacts.length === 0
                ? "No contacts yet.\nAdd people to start chatting."
                : "No contacts match your search."}
            </p>
            {contacts.length === 0 && (
              <button onClick={() => setAdding(true)} className="rounded-full bg-teal px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark">
                Add contacts
              </button>
            )}
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto bg-white">
            {list.map((c) => (
              <li key={c.id}>
                <Link href={`/contacts/${c.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/[0.03]">
                  <Avatar name={c.name} size={42} />
                  <span className="flex-1 border-b border-black/5 py-2">
                    <span className="block font-medium text-ink">{c.name}</span>
                    <span className="block text-xs text-ink/45">+{c.phone}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {adding && (
        <AddContactSheet
          onClose={() => setAdding(false)}
          onChange={refresh}
        />
      )}
    </AppShell>
  );
}

function AddContactSheet({
  onClose,
  onChange,
}: {
  onClose: () => void;
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const canAdd = name.trim().length > 0 && isValidNational(phone);

  async function importDevice() {
    setError("");
    try {
      const picked = await pickDeviceContacts();
      if (picked.length === 0) {
        setError("No contacts were selected.");
        return;
      }
      addContacts(picked);
      onChange();
      setAdded((a) => [...a, ...picked.map((p) => p.name || `+${p.phone}`)]);
    } catch {
      setError("Could not read device contacts.");
    }
  }

  // Add the current entry and keep the sheet open for the next one.
  function addManual() {
    if (!canAdd) return;
    const label = name.trim();
    addContacts([{ name, phone }]);
    onChange();
    setAdded((a) => [...a, label]);
    setName("");
    setPhone("");
    setError("");
    nameRef.current?.focus();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/10 md:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Add contacts</h2>
          {added.length > 0 && (
            <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-teal-dark">
              {added.length} added
            </span>
          )}
        </div>

        {supportsDeviceContacts() && (
          <>
            <button
              onClick={importDevice}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3 text-sm font-semibold text-white hover:bg-teal-dark"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" />
              </svg>
              Import from phone
            </button>
            <div className="mb-4 flex items-center gap-3 text-xs text-ink/40">
              <span className="h-px flex-1 bg-black/10" /> or add manually <span className="h-px flex-1 bg-black/10" />
            </div>
          </>
        )}

        <div className="space-y-5">
          <div className="field">
            <label>Name</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact name"
            />
          </div>
          <div className="field">
            <label>Phone</label>
            <input
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && addManual()}
              placeholder="Phone number"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {added.length > 0 && (
          <p className="mt-3 truncate text-xs text-ink/50">
            Added: {added.join(", ")}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-black/10 py-3 text-sm font-semibold text-ink/70">
            {added.length > 0 ? "Done" : "Cancel"}
          </button>
          <button
            onClick={addManual}
            disabled={!canAdd}
            className="flex-1 rounded-full py-3 text-sm font-semibold text-white disabled:bg-teal-soft enabled:bg-teal enabled:hover:bg-teal-dark"
          >
            Add another
          </button>
        </div>
      </div>
    </div>
  );
}
