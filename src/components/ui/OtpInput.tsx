"use client";

import { useRef, useCallback } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusInput = useCallback(
    (index: number) => {
      if (index >= 0 && index < length) {
        inputsRef.current[index]?.focus();
      }
    },
    [length]
  );

  const updateValue = useCallback(
    (newDigits: string[]) => {
      onChange(newDigits.join("").slice(0, length));
    },
    [onChange, length]
  );

  const handleChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const char = e.target.value;

      // Only accept single digits
      if (!/^\d?$/.test(char)) return;

      const newDigits = [...digits];
      newDigits[index] = char;
      updateValue(newDigits);

      if (char && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [digits, length, focusInput, updateValue]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (!digits[index] && index > 0) {
          // Current box is empty — move back and clear previous
          const newDigits = [...digits];
          newDigits[index - 1] = "";
          updateValue(newDigits);
          focusInput(index - 1);
        } else {
          // Clear current box
          const newDigits = [...digits];
          newDigits[index] = "";
          updateValue(newDigits);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [digits, length, focusInput, updateValue]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (!pasted) return;

      const newDigits = pasted.split("").concat(Array(length).fill("")).slice(0, length);
      updateValue(newDigits);

      // Focus the box after the last pasted digit, or the last box
      focusInput(Math.min(pasted.length, length - 1));
    },
    [length, focusInput, updateValue]
  );

  return (
    <div className="flex gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-semibold rounded-xl border border-surface-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
        />
      ))}
    </div>
  );
}
