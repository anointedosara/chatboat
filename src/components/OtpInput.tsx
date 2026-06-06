"use client";

import { useRef } from "react";

/** Four single-digit boxes with auto-advance, backspace, and paste support. */
export default function OtpInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(4, " ").slice(0, 4).split("");

  function setAt(index: number, digit: string) {
    const arr = value.padEnd(4, " ").slice(0, 4).split("");
    arr[index] = digit || " ";
    onChange(arr.join("").replace(/\s/g, ""));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    setAt(index, digit);
    if (index < 3) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index].trim()) {
        setAt(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setAt(index - 1, "");
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, 3)]?.focus();
  }

  return (
    <div className="flex justify-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d.trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          className="h-14 w-14 rounded-full border-[1.5px] border-teal-soft bg-white text-center text-xl font-semibold text-ink outline-none focus:border-teal disabled:opacity-60"
        />
      ))}
    </div>
  );
}
