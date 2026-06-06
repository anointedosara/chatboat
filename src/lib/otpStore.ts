/**
 * Server-side, in-memory OTP store.
 *
 * Dev-grade only: state lives in the Node process, so it resets on a full
 * server restart and would not be shared across multiple serverless
 * instances. When SMS goes to a real provider this should move to a shared
 * store (Redis / database). It is kept on `globalThis` so it survives
 * dev-server hot reloads.
 */

export const OTP_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
export const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

type OtpRecord = {
  code: string;
  expiresAt: number;
  lastSentAt: number;
};

const g = globalThis as unknown as { __chatboatOtp?: Map<string, OtpRecord> };
const store: Map<string, OtpRecord> = g.__chatboatOtp ?? new Map();
g.__chatboatOtp = store;

function generateCode(): string {
  // 4-digit code, 1000–9999 (never leading-zero, matches the mockup boxes)
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * How long until the phone is allowed to request a new code.
 * Returns 0 when a resend is allowed right now.
 */
export function resendWaitMs(phone: string, now = Date.now()): number {
  const rec = store.get(phone);
  if (!rec) return 0;
  return Math.max(0, RESEND_COOLDOWN_MS - (now - rec.lastSentAt));
}

/**
 * Create and store a fresh code, replacing (and thereby invalidating) any
 * previous code for this phone. Caller must check `resendWaitMs` first.
 */
export function createOtp(phone: string, now = Date.now()): string {
  const code = generateCode();
  store.set(phone, {
    code,
    expiresAt: now + OTP_EXPIRY_MS,
    lastSentAt: now,
  });
  return code;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "mismatch" };

/** Verify a code; a correct code is consumed (single use). */
export function verifyOtp(phone: string, code: string, now = Date.now()): VerifyResult {
  const rec = store.get(phone);
  if (!rec) return { ok: false, reason: "no_code" };
  if (now > rec.expiresAt) {
    store.delete(phone);
    return { ok: false, reason: "expired" };
  }
  if (rec.code !== code) return { ok: false, reason: "mismatch" };
  store.delete(phone);
  return { ok: true };
}
