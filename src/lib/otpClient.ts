"use client";

/** Thin client wrappers over the OTP route handlers. */

export type SendResponse = {
  ok: boolean;
  error?: string;
  retryAfterMs?: number;
  resendAfterMs?: number;
  expiresInMs?: number;
  devCode?: string;
};

export type VerifyResponse = {
  ok: boolean;
  error?: string;
};

export async function requestOtp(phone: string): Promise<SendResponse> {
  const res = await fetch("/api/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  return (await res.json()) as SendResponse;
}

export async function confirmOtp(phone: string, code: string): Promise<VerifyResponse> {
  const res = await fetch("/api/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  return (await res.json()) as VerifyResponse;
}
