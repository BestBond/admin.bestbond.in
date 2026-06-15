const COUPON_CODE_PATTERN = /^[0-9A-F]{12}$/;

export function buildCouponQrUrl(code: string): string {
  const base = String(import.meta.env.VITE_API_URL ?? 'https://api.bestbond.in').replace(
    /\/$/,
    '',
  );
  const normalized = code.trim().toUpperCase();
  if (!COUPON_CODE_PATTERN.test(normalized)) {
    return code.trim();
  }
  return `${base}/c/${normalized}`;
}
