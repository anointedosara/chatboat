"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthHeader from "@/components/AuthHeader";
import OtpInput from "@/components/OtpInput";
import Link from "next/link";
import { clearPending, getPending, type PendingVerification } from "@/lib/pending";
import { confirmOtp, requestOtp } from "@/lib/otpClient";
import { getCurrentUser, setCurrentUser, updateUser } from "@/lib/users";

const RESEND_SECONDS = 60;

const ERROR_TEXT: Record<string, string> = {
  expired: "That code has expired. Please resend a new one.",
  mismatch: "Incorrect code. Please check and try again.",
  no_code: "No active code. Please resend.",
};

export default function OtpPage() {
  const router = useRouter();
  const [pending, setPendingState] = useState<PendingVerification | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success">("idle");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pull the verification context; bounce back to register if there is none.
  useEffect(() => {
    const p = getPending();
    if (!p) {
      router.replace("/register");
      return;
    }
    setPendingState(p);
    setDevCode(p.devCode);
  }, [router]);

  // Resend cooldown countdown.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!pending || code.length !== 4 || status === "verifying") return;
    setError("");
    setStatus("verifying");
    const res = await confirmOtp(pending.phone, code);
    if (res.ok) {
      if (pending.mode === "change" && pending.prevPhone) {
        // Commit the verified phone-number change on the existing account.
        const u = getCurrentUser();
        if (u) updateUser(pending.prevPhone, { name: u.name, email: u.email, phone: pending.phone });
        setStatus("success");
        clearPending();
        setTimeout(() => router.replace("/settings"), 1300);
      } else {
        setCurrentUser(pending.phone);
        setStatus("success");
        clearPending();
        setTimeout(() => router.replace("/chats"), 1300);
      }
      return;
    }
    setStatus("idle");
    setCode("");
    setError(ERROR_TEXT[res.error ?? ""] ?? "Verification failed. Try again.");
  }

  async function onResend() {
    if (!pending || secondsLeft > 0) return;
    setError("");
    setCode("");
    const res = await requestOtp(pending.phone);
    if (!res.ok) {
      if (res.error === "cooldown" && res.retryAfterMs) {
        setSecondsLeft(Math.ceil(res.retryAfterMs / 1000));
      } else {
        setError("Could not resend the code. Please try again.");
      }
      return;
    }
    setDevCode(res.devCode);
    setSecondsLeft(RESEND_SECONDS);
  }

  if (!pending) return null;

  if (status === "success") {
    return <SuccessView name={pending.name} mode={pending.mode} />;
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <AuthHeader
        title="OTP verification"
        subtitle="Please enter your correct OTP for number verification process."
        showBack
      />

      <form onSubmit={onVerify} className="flex flex-1 flex-col px-6 pt-10">
        <p className="mb-6 text-center text-sm text-ink/70">
          Code sent to <span className="font-semibold text-ink">{pending.display}</span>
        </p>

        <OtpInput value={code} onChange={setCode} disabled={status === "verifying"} />

        {devCode && (
          <p className="mt-4 text-center text-xs text-teal-dark">
            Dev mode — your code is <span className="font-bold">{devCode}</span>
          </p>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

        <div className="mt-auto pb-7 pt-8">
          <button
            type="submit"
            disabled={code.length !== 4 || status === "verifying"}
            className="flex w-full items-center justify-center rounded-full py-3.5 text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-teal-soft enabled:bg-teal enabled:hover:bg-teal-dark"
          >
            {status === "verifying" ? <span className="spinner" /> : "Verify"}
          </button>

          <div className="mt-5 text-center text-sm">
            {secondsLeft > 0 ? (
              <span className="text-ink/60">
                Resend OTP in 0:{String(secondsLeft).padStart(2, "0")}
              </span>
            ) : (
              <button
                type="button"
                onClick={onResend}
                className="font-semibold text-teal-dark underline-offset-2 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function SuccessView({
  name,
  mode,
}: {
  name?: string;
  mode: "register" | "login" | "change";
}) {
  const heading =
    mode === "register" ? "You're all set" : mode === "change" ? "Number updated" : "Welcome back";
  const subtitle = mode === "change" ? "Taking you back to settings…" : "Taking you to your chats…";
  return (
    <div className="flex flex-1 flex-col bg-white">
      <AuthHeader
        title="OTP verification"
        subtitle="Your number has been verified successfully."
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink">
            {heading}
            {mode !== "change" && name ? `, ${name}` : ""}!
          </h2>
          <p className="mt-2 text-sm text-ink/70">
            Your number is verified. {subtitle}
          </p>
        </div>
        <Link
          href={mode === "change" ? "/settings" : "/chats"}
          className="mt-2 rounded-full bg-teal px-8 py-3 text-sm font-semibold text-white hover:bg-teal-dark"
        >
          {mode === "change" ? "Back to settings" : "Go to chats"}
        </Link>
      </div>
    </div>
  );
}
