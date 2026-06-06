"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { getCurrentUser, updateUser } from "@/lib/users";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { setPending } from "@/lib/pending";
import { requestOtp } from "@/lib/otpClient";

/** Downscale an image file to a small square-ish data URL for storage. */
function resizeImage(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("bad image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function EditProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [origPhone, setOrigPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setOrigPhone(u.phone);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone);
    setAvatar(u.avatar);
  }, [router]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSave = name.trim().length > 0 && emailOk && isValidPhone(phone) && !busy;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await resizeImage(file);
      setAvatar(dataUrl);
    } catch {
      setError("Could not load that image.");
    } finally {
      e.target.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!canSave) return;

    const newPhone = normalizePhone(phone);
    const phoneChanged = newPhone !== origPhone;

    // Persist name / email / picture immediately (keeping the current number).
    updateUser(origPhone, { name, email, phone: origPhone, avatar });

    if (!phoneChanged) {
      setSaved(true);
      setTimeout(() => router.push("/settings"), 900);
      return;
    }

    // Phone changed → verify the new number with an OTP before switching.
    setBusy(true);
    const res = await requestOtp(newPhone);
    if (!res.ok) {
      setBusy(false);
      setError("Could not send a verification code to the new number.");
      return;
    }
    setPending({
      phone: newPhone,
      display: `+${newPhone}`,
      mode: "change",
      prevPhone: origPhone,
      name: name.trim(),
      devCode: res.devCode,
    });
    router.push("/otp");
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white">
      <header className="flex items-center gap-3 bg-teal px-4 py-4 text-white">
        <button aria-label="Back" onClick={() => router.back()} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Edit Profile</h1>
      </header>

      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-8">
        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative rounded-full"
            aria-label="Change profile picture"
          >
            <Avatar name={name || "User"} src={avatar} size={88} />
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white text-teal-dark shadow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </span>
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-medium text-teal-dark">
            Change profile
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
        </div>

        <div className="space-y-6">
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label>Phone</label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              autoComplete="tel"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        {saved && <p className="mt-4 text-center text-sm text-teal-dark">Profile updated ✓</p>}

        <div className="mt-auto pb-8 pt-10">
          <button
            type="submit"
            disabled={!canSave}
            className="flex w-full items-center justify-center rounded-full py-3.5 text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-teal-soft enabled:bg-teal enabled:hover:bg-teal-dark"
          >
            {busy ? <span className="spinner" /> : "Update Profile"}
          </button>
          <p className="mt-3 text-center text-xs text-ink/40">
            Changing your number will send an OTP to verify it.
          </p>
        </div>
      </form>
    </div>
  );
}
