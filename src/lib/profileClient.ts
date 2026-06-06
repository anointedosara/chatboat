"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/users";

export type PeerProfile = { name?: string; avatar?: string };

const cache = new Map<string, { profile: PeerProfile; at: number }>();
const STALE_MS = 5 * 60 * 1000;

/** Publish the signed-in user's name + avatar so other users can see them. */
export async function publishProfile(user: User | undefined | null): Promise<void> {
  if (!user) return;
  cache.set(user.phone, {
    profile: { name: user.name, avatar: user.avatar },
    at: Date.now(),
  });
  try {
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: user.phone, name: user.name, avatar: user.avatar }),
    });
  } catch {
    /* best effort */
  }
}

/** Fetch profiles for a set of phones, using a short-lived client cache. */
export async function fetchProfiles(phones: string[]): Promise<Record<string, PeerProfile>> {
  const unique = Array.from(new Set(phones.filter(Boolean)));
  const now = Date.now();
  const missing = unique.filter((p) => {
    const c = cache.get(p);
    return !c || now - c.at > STALE_MS;
  });

  if (missing.length) {
    try {
      const res = await fetch(`/api/profile?phones=${missing.join(",")}`, { cache: "no-store" });
      const data = await res.json();
      const profiles = (data.profiles ?? {}) as Record<string, PeerProfile>;
      missing.forEach((p) => cache.set(p, { profile: profiles[p] ?? {}, at: now }));
    } catch {
      missing.forEach((p) => cache.set(p, { profile: cache.get(p)?.profile ?? {}, at: now }));
    }
  }

  const out: Record<string, PeerProfile> = {};
  unique.forEach((p) => (out[p] = cache.get(p)?.profile ?? {}));
  return out;
}

/** Hook: a single peer's shared profile (name + avatar). */
export function usePeerProfile(phone: string | undefined): PeerProfile {
  const [profile, setProfile] = useState<PeerProfile>(() =>
    phone ? cache.get(phone)?.profile ?? {} : {},
  );
  useEffect(() => {
    if (!phone) return;
    let alive = true;
    fetchProfiles([phone]).then((m) => {
      if (alive) setProfile(m[phone] ?? {});
    });
  }, [phone]);
  return profile;
}
