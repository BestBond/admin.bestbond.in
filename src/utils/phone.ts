/**
 * Local mobile digits for OTP APIs (10 digits, no country prefix).
 * Users often paste "919xxxxxxxxx" while country code is already +91 — strip the duplicate 91.
 */
export function normalizeLocalPhoneDigits(
  raw: string,
  countryCode: string,
): string {
  let d = raw.replace(/\D/g, "");
  const cc = countryCode.replace(/\D/g, "");

  if (cc === "91" && d.startsWith("91") && d.length > 10) {
    d = d.slice(2);
  }
  while (d.startsWith("0") && d.length > 10) {
    d = d.slice(1);
  }
  if (d.length > 10) {
    d = d.slice(-10);
  }
  return d.slice(0, 10);
}
