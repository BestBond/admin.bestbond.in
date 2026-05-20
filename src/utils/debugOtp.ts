/** Read 6-digit test OTP from POST /auth/otp/request (devCode) or wrapped API bodies. */
export function extractDebugOtp(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const src = payload as Record<string, unknown>;
  const nested =
    src.data && typeof src.data === "object"
      ? (src.data as Record<string, unknown>)
      : null;

  const candidates: unknown[] = [
    src.devCode,
    src.otp,
    src.code,
    nested?.devCode,
    nested?.otp,
    nested?.code,
  ];

  for (const v of candidates) {
    const text = String(v ?? "").trim();
    if (/^\d{6}$/.test(text)) return text;
  }

  const msg = String(src.message ?? nested?.message ?? "");
  const m = msg.match(/\b(\d{6})\b/);
  return m ? m[1] : null;
}
