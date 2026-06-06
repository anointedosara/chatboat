"use client";

import { COUNTRIES } from "@/lib/countries";

/**
 * A phone input with a leading country-code dropdown.
 * The parent owns both the selected country (ISO) and the national number.
 */
export default function PhoneField({
  label,
  iso,
  onIsoChange,
  national,
  onNationalChange,
  placeholder = "Enter your number",
}: {
  label: string;
  iso: string;
  onIsoChange: (iso: string) => void;
  national: string;
  onNationalChange: (national: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <label className="absolute -top-2 left-4 z-10 bg-white px-1.5 text-xs font-medium text-teal-dark">
        {label}
      </label>
      <div className="flex items-center rounded-full border-[1.5px] border-teal-soft bg-white pl-3.5 pr-4 focus-within:border-teal">
        {/* Country dropdown — shows just the flag + dial code */}
        <div className="relative flex shrink-0 items-center">
          <select
            aria-label="Country code"
            value={iso}
            onChange={(e) => onIsoChange(e.target.value)}
            className="cursor-pointer appearance-none bg-transparent py-3.5 pr-5 text-sm text-ink outline-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.flag} +{c.dial}
              </option>
            ))}
          </select>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute right-0 text-teal-dark/70"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <span className="mx-1 h-6 w-px shrink-0 bg-teal-soft" />

        <input
          type="tel"
          inputMode="numeric"
          value={national}
          onChange={(e) => onNationalChange(e.target.value.replace(/\D/g, ""))}
          placeholder={placeholder}
          autoComplete="tel-national"
          maxLength={14}
          className="w-full border-0 bg-transparent py-3.5 pl-2 text-[0.95rem] text-ink outline-none"
        />
      </div>
    </div>
  );
}
