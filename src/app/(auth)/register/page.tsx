"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthHeader from "@/components/AuthHeader";
import PhoneField from "@/components/PhoneField";
import { fullNumber, isValidNational } from "@/lib/phone";
import { DEFAULT_ISO, dialFor } from "@/lib/countries";
import { findUserByEmail, findUserByPhone, saveUser } from "@/lib/users";
import { setPending } from "@/lib/pending";
import { requestOtp } from "@/lib/otpClient";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [iso, setIso] = useState(DEFAULT_ISO);
  const [national, setNational] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit =
    name.trim().length > 0 && emailOk && isValidNational(national) && !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!canSubmit) return;

    const dial = dialFor(iso);
    const phone = fullNumber(dial, national);

    // Already registered? Send them to login instead.
    if (findUserByPhone(phone) || findUserByEmail(email)) {
      setNotice("You already have an account. Taking you to login…");
      setTimeout(() => router.push("/login"), 1200);
      return;
    }

    setBusy(true);
    saveUser({ name, email, phone });
    const res = await requestOtp(phone);
    if (!res.ok) {
      setBusy(false);
      setError("Could not send the verification code. Please try again.");
      return;
    }
    setPending({
      phone,
      display: `+${dial} ${national}`,
      mode: "register",
      name: name.trim(),
      devCode: res.devCode,
    });
    router.push("/otp");
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <AuthHeader title="Register" subtitle="Fill up your details to register." />

      <form onSubmit={onSubmit} className="flex flex-1 flex-col px-6 pt-9">
        <div className="space-y-6">
          <div className="field">
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <PhoneField
            label="Mobile"
            iso={iso}
            onIsoChange={setIso}
            national={national}
            onNationalChange={setNational}
            placeholder="Enter mobile number"
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        {notice && <p className="mt-4 text-sm text-teal-dark">{notice}</p>}

        <div className="mt-auto pb-7 pt-8">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center rounded-full py-3.5 text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-teal-soft enabled:bg-teal enabled:hover:bg-teal-dark"
          >
            {busy ? <span className="spinner" /> : "Register"}
          </button>
          <p className="mt-5 text-center text-sm text-ink/70">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-teal-dark">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
