"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthHeader from "@/components/AuthHeader";
import PhoneField from "@/components/PhoneField";
import { fullNumber, isValidNational } from "@/lib/phone";
import { DEFAULT_ISO, dialFor } from "@/lib/countries";
import { findUserByPhone } from "@/lib/users";
import { setPending } from "@/lib/pending";
import { requestOtp } from "@/lib/otpClient";

export default function LoginPage() {
  const router = useRouter();
  const [iso, setIso] = useState(DEFAULT_ISO);
  const [national, setNational] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = isValidNational(national) && !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;

    const dial = dialFor(iso);
    const phone = fullNumber(dial, national);

    // Login is only for accounts we know about.
    const user = findUserByPhone(phone);
    if (!user) {
      setError("No account found for this number. Please register first.");
      return;
    }

    setBusy(true);
    const res = await requestOtp(phone);
    if (!res.ok) {
      setBusy(false);
      setError("Could not send the verification code. Please try again.");
      return;
    }
    setPending({
      phone,
      display: `+${dial} ${national}`,
      mode: "login",
      name: user.name,
      devCode: res.devCode,
    });
    router.push("/otp");
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <AuthHeader
        title="Login"
        subtitle="Enter your mobile number to continue."
        showBack
      />

      <form onSubmit={onSubmit} className="flex flex-1 flex-col px-6 pt-9">
        <PhoneField
          label="Phone"
          iso={iso}
          onIsoChange={setIso}
          national={national}
          onNationalChange={setNational}
          placeholder="Enter your number"
        />

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="mt-auto pb-7 pt-8">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center rounded-full py-3.5 text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-teal-soft enabled:bg-teal enabled:hover:bg-teal-dark"
          >
            {busy ? <span className="spinner" /> : "Login"}
          </button>
          <p className="mt-5 text-center text-sm text-ink/70">
            Dont have an account?{" "}
            <Link href="/register" className="font-semibold text-teal-dark">
              Register
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
