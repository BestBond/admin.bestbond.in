import api from "./api";

const PREVIEW_TIMEOUT_MS = 300_000;

export async function fetchCouponBatchPreviewHtml(batchId: string): Promise<string> {
  const id = batchId.trim();
  const res = await api.get<string>(
    `/coupons/batches/${encodeURIComponent(id)}/preview.html`,
    { responseType: "text", timeout: PREVIEW_TIMEOUT_MS },
  );
  return typeof res.data === "string" ? res.data : String(res.data);
}

export async function fetchCouponFacePreviewHtml(
  batchId: string,
  code: string,
): Promise<string> {
  const id = batchId.trim();
  const c = code.trim();
  const res = await api.get<string>(
    `/coupons/batches/${encodeURIComponent(id)}/preview-face.html`,
    {
      params: { code: c },
      responseType: "text",
      timeout: PREVIEW_TIMEOUT_MS,
    },
  );
  return typeof res.data === "string" ? res.data : String(res.data);
}
