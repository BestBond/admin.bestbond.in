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

  /** SMS / WebOTP autofill often inserts all digits at once; maxLength=1 on the first cell drops the rest. */
  const handleChange = (raw: string, index: number) => {
    const digitsOnly = raw.replace(/\D/g, "");
    if (digitsOnly.length > 1) {
      onChange(digitsOnly.slice(0, length));
      const nextFocus = Math.min(Math.max(digitsOnly.length - 1, 0), length - 1);
      requestAnimationFrame(() => inputsRef.current[nextFocus]?.focus());
      return;
    }
    const val = digitsOnly;
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
    index: number,
  ) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasteData) return;
    onChange(pasteData);
    requestAnimationFrame(() =>
      inputsRef.current[Math.min(pasteData.length, length) - 1]?.focus(),
    );
  };

  return (
    <div className="flex gap-4">
      {otpArray.map((digit, index) => (
        <input
          key={index}
          id={index === 0 ? "admin-login-otp" : undefined}
          name={`otp-digit-${index}`}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="next"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={index === 0 ? "Verification code" : `Digit ${index + 1}`}
          value={digit}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange(e.target.value, index)
          }
          onKeyDown={(e) => handleBackspace(e, index)}
          onPaste={handlePaste}
          maxLength={index === 0 ? length : 1}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className="w-13 h-13 text-center rounded-full border-[2px] border-border-light bg-white text-2xl font-bold outline-none focus:ring-1 focus:ring-brand-orange transition-all font-bricolage"
        />
      ))}
    </div>
  );
};

export default OtpInput;