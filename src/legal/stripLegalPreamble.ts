export function stripTermsPreamble(body: string): string {
  return body.replace(
    /^TERMS & CONDITIONS\s*\nBestBond Rewards Program Mobile Application\s*\nLast Updated:[^\n]*\n+/i,
    '',
  );
}

export function stripPrivacyPreamble(body: string): string {
  return body.replace(
    /^PRIVACY POLICY\s*\nBestBond Rewards Program Mobile Application\s*\nLast Updated:[^\n]*\n+/i,
    '',
  );
}
