"use client";

/**
 * The verification context handed from register/login to the OTP page,
 * stored in sessionStorage so the phone number is not exposed in the URL.
 */
export type PendingVerification = {
  phone: string; // normalized (10 digits)
  display: string; // human-friendly number to show on the OTP screen
  mode: "register" | "login" | "change";
  name?: string;
  /** For a phone-number change: the previous (current) number. */
  prevPhone?: string;
  /** Dev-only: the code, surfaced on screen for testing. Undefined in prod. */
  devCode?: string;
};

const KEY = "chatboat:pending";

export function setPending(p: PendingVerification): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(p));
}

export function getPending(): PendingVerification | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingVerification) : null;
  } catch {
    return null;
  }
}

export function clearPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
