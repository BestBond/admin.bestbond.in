/** Resolve reward image paths from the API (e.g. /gifts/foo.png) to absolute URLs. */
export function rewardImageSrc(imageUrl: string | null | undefined): string {
  const raw = imageUrl?.trim();
  if (!raw) {
    return 'https://ui-avatars.com/api/?name=Gift&background=F26522&color=fff';
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}
