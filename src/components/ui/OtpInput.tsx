

import { useRef } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
};

const OtpInput = ({ length = 6, value, onChange }: OtpInputProps) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Ensure value has correct length
  const otpArray = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = (val: string, index: number) => {
    if (!/^[0-9]?$/.test(val)) return;

    const newOtp = [...otpArray];
    newOtp[index] = val;

    const finalOtp = newOtp.join("").slice(0, length);
    onChange(finalOtp);

    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text").slice(0, length);
    if (!/^\d+$/.test(pasteData)) return;
    onChange(pasteData);
  };

  return (
    <div className="flex gap-4">
      {otpArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          value={digit}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange(e.target.value, index)
          }
          onKeyDown={(e) => handleBackspace(e, index)}
          onPaste={handlePaste}
          maxLength={1}
          className="w-13 h-13 text-center rounded-full border-[2px] border-border-light bg-white text-2xl font-bold outline-none focus:ring-1 focus:ring-brand-orange transition-all font-bricolage"
        />
      ))}
    </div>
  );
};

export default OtpInput;