/**
 * Phone helpers. Numbers are handled as full international values:
 * a country dial code (e.g. "91") plus a national number, stored and keyed
 * as digits only (e.g. "919876543210").
 */

export function digitsOnly(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

/** Backwards-compatible alias: a stable, digits-only key for a number. */
export function normalizePhone(raw: string): string {
  return digitsOnly(raw);
}

/** Build the full international key from a dial code + national number. */
export function fullNumber(dial: string, national: string): string {
  return digitsOnly(dial) + digitsOnly(national);
}

/** Validate a full international number (rough E.164 bounds). */
export function isValidPhone(raw: string): boolean {
  const d = digitsOnly(raw);
  return d.length >= 8 && d.length <= 15;
}

/** Validate just the national part the user typed. */
export function isValidNational(raw: string): boolean {
  const d = digitsOnly(raw);
  return d.length >= 6 && d.length <= 14;
}
