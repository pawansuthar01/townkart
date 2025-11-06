"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
  className?: string;
}

export function OTPInput({
  value,
  onChange,
  disabled = false,
  length = 4,
  className,
}: OTPInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleInputChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, "");

    if (digit.length > 1) {
      // Handle paste operation
      const digits = digit.slice(0, length).split("");
      const newValue = digits.join("");
      onChange(newValue);

      // Focus the next empty input or the last input
      const nextIndex = Math.min(newValue.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Update the value at the specific index
    const currentDigits = value.split("");
    currentDigits[index] = digit;
    const newValue = currentDigits.slice(0, length).join("");
    onChange(newValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        // Move to previous input and clear it
        const newValue = value.split("");
        newValue[index - 1] = "";
        onChange(newValue.slice(0, length).join(""));
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newValue = value.split("");
        newValue[index] = "";
        onChange(newValue.slice(0, length).join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (pasteData) {
      onChange(pasteData);
      const nextIndex = Math.min(pasteData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }, (_, index) => {
        const digit = value[index] || "";
        const isFocused = focusedIndex === index;
        const hasValue = !!digit;

        return (
          <div key={index} className="relative">
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              onPaste={handlePaste}
              disabled={disabled}
              className={cn(
                "w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg",
                "transition-all duration-200 focus:outline-none",
                "bg-white text-gray-900 placeholder-gray-400",
                {
                  "border-townkart-primary ring-2 ring-townkart-primary/20":
                    isFocused,
                  "border-gray-300 hover:border-gray-400":
                    !isFocused && !hasValue,
                  "border-green-500 bg-green-50": hasValue && !isFocused,
                  "border-gray-200 bg-gray-50 cursor-not-allowed": disabled,
                },
              )}
              autoComplete="one-time-code"
            />

            {/* Animated cursor */}
            {isFocused && !hasValue && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-0.5 h-6 bg-townkart-primary animate-pulse" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
