"use client";

/**
 * Device contacts via the Contacts Picker API.
 * Supported on Chrome/Edge for Android (HTTPS + user gesture) only — not on
 * desktop browsers or iOS Safari. Callers should offer a manual fallback.
 */

type ContactsManager = {
  select: (
    props: string[],
    options?: { multiple?: boolean },
  ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
};

function manager(): ContactsManager | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as unknown as { contacts?: ContactsManager };
  const hasManager =
    typeof window !== "undefined" && "ContactsManager" in window;
  return nav.contacts && hasManager ? nav.contacts : null;
}

export function supportsDeviceContacts(): boolean {
  return manager() !== null;
}

export async function pickDeviceContacts(): Promise<
  { name: string; phone: string }[]
> {
  const mgr = manager();
  if (!mgr) return [];
  const selected = await mgr.select(["name", "tel"], { multiple: true });
  const out: { name: string; phone: string }[] = [];
  for (const c of selected) {
    const name = c.name?.[0] ?? "";
    // One entry per phone number on the contact.
    for (const tel of c.tel ?? []) {
      out.push({ name, phone: tel });
    }
    if (!c.tel?.length && name) out.push({ name, phone: "" });
  }
  return out.filter((c) => c.phone);
}
