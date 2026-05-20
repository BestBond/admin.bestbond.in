import { useRef } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

type PasscodeInputProps = {
  length?: number;
  value: string;
  onChange: (passcode: string) => void;
  idPrefix?: string;
};

const PasscodeInput = ({
  length = 6,
  value,
  onChange,
  idPrefix = "passcode",
}: PasscodeInputProps) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const passcodeArray = value
    .split("")
    .concat(Array(length).fill(""))
    .slice(0, length);

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

    const newPasscode = [...passcodeArray];
    newPasscode[index] = val;
    const finalPasscode = newPasscode.join("").slice(0, length);
    onChange(finalPasscode);

    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !passcodeArray[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasteData) return;
    onChange(pasteData);
    requestAnimationFrame(() =>
      inputsRef.current[Math.min(pasteData.length, length) - 1]?.focus(),
    );
  };

  return (
    <div className="flex gap-4">
      {passcodeArray.map((digit, index) => (
        <input
          key={index}
          id={index === 0 ? `${idPrefix}-digit-0` : undefined}
          name={`${idPrefix}-digit-${index}`}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="next"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={index === 0 ? "Passcode" : `Passcode digit ${index + 1}`}
          value={digit}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange(e.target.value, index)
          }
          onKeyDown={(e) => handleBackspace(e, index)}
          onPaste={handlePaste}
          maxLength={index === 0 ? length : 1}
          autoComplete={index === 0 ? "off" : "off"}
          className="w-13 h-13 text-center rounded-full border-[2px] border-border-light bg-white text-2xl font-bold outline-none focus:ring-1 focus:ring-brand-orange transition-all font-bricolage"
        />
      ))}
    </div>
  );
};

export default PasscodeInput;
