import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import ExportProgressOverlay from "../components/coupons/ExportProgressOverlay";
import { BiDownload } from "react-icons/bi";
import { MdArrowBack, MdClose, MdPictureAsPdf } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import api, { isAxiosError } from "../utils/api";
import Swal from "sweetalert2";
import { useCallback, useEffect, useState } from "react";
import { fetchCouponBatchPreviewHtml } from "../utils/couponPreview";
import "../App.css";

const COUPON_PDF_REQUEST_TIMEOUT_MS = 300_000;
const COUPON_EXPORT_SYNC_MAX = 300;
const COUPON_EXPORT_POLL_MS = 2_000;
const COUPON_EXPORT_POLL_TIMEOUT_MS = 30_000;
const COUPON_EXPORT_MAX_POLL_RETRIES = 30;

type ExportJobStatus = {
  jobId: string;
  status: string;
  phase?: string;
  progressPct: number;
  processedCoupons: number;
  totalCoupons: number;
  fileSizeBytes?: number | null;
  ready: boolean;
  failed: boolean;
  error?: string | null;
};

type BatchExportMeta = {
  batchId: string;
  totalCoupons: number;
  syncMax: number;
  useAsyncExport: boolean;
};

function exportJobStorageKey(batchId: string): string {
  return `couponExportJob:${batchId}`;
}

function overlayTitle(status: ExportJobStatus | null): string {
  if (!status) return "Preparing export…";
  if (status.phase === "zipping") return "Packaging ZIP file…";
  if (status.phase === "downloading") return "Starting download…";
  if (status.ready || status.phase === "ready") return "Preparing download…";
  if (status.progressPct > 0) return "Generating coupon PDFs…";
  return "Starting export…";
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollExportJobUntilReady(
  batchId: string,
  jobId: string,
  onProgress: (status: ExportJobStatus) => void,
): Promise<ExportJobStatus> {
  let networkRetries = 0;

  for (;;) {
    try {
      const res = await api.get<ExportJobStatus>(
        `/coupons/batches/${encodeURIComponent(batchId)}/export/jobs/${encodeURIComponent(jobId)}`,
        { timeout: COUPON_EXPORT_POLL_TIMEOUT_MS },
      );
      networkRetries = 0;
      const status = res.data;
      onProgress(status);
      if (status.ready) return status;
      if (status.failed) {
        throw new Error(status.error ?? "Export failed on the server");
      }
    } catch (err) {
      if (
        isAxiosError(err) &&
        !err.response &&
        networkRetries < COUPON_EXPORT_MAX_POLL_RETRIES
      ) {
        networkRetries += 1;
        await sleep(3000);
        continue;
      }
      throw err;
    }
    await sleep(COUPON_EXPORT_POLL_MS);
  }
}

async function triggerBrowserZipDownload(
  batchId: string,
  jobId: string,
): Promise<{ fileSizeBytes: number }> {
  const res = await api.get<{ path: string; fileSizeBytes: number }>(
    `/coupons/batches/${encodeURIComponent(batchId)}/export/jobs/${encodeURIComponent(jobId)}/download-link`,
  );
  const base = (import.meta.env.VITE_API_URL as string).replace(/\/$/, "");
  const downloadUrl = `${base}${res.data.path}`;

  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `coupon-batch-${batchId}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  return { fileSizeBytes: res.data.fileSizeBytes };
}

async function parseApiErrorPayload(data: unknown): Promise<string | null> {
  if (typeof data === "string") {
    try {
      const j = JSON.parse(data) as { message?: string | { message?: string }; code?: string };
      if (typeof j.message === "string") return j.message;
      if (j.message && typeof j.message === "object" && "message" in j.message) {
        return String(j.message.message);
      }
    } catch {
      return data || null;
    }
  }
  if (typeof data === "object" && data !== null && "message" in data) {
    const msg = (data as { message: unknown }).message;
    if (typeof msg === "string") return msg;
    if (typeof msg === "object" && msg !== null && "message" in msg) {
      return String((msg as { message: string }).message);
    }
  }
  return null;
}

async function exportErrorMessage(err: unknown, isZip = false): Promise<string> {
  if (isAxiosError(err) && !err.response) {
    const code = err.code ?? "";
    if (code === "ECONNABORTED" || /timeout/i.test(err.message)) {
      return isZip
        ? "Export timed out. Click Download ZIP again — progress is saved and export will resume."
        : "PDF generation timed out. Try again or export fewer coupons.";
    }
    if (/network error|failed to fetch/i.test(err.message)) {
      return isZip
        ? "Connection lost during export. Click Download ZIP again to resume from the last checkpoint."
        : "Connection lost. Wait a moment and try again.";
    }
  }
  if (!isAxiosError(err) || !err.response?.data) {
    return String((err as Error)?.message ?? "Export failed");
  }
  const data = err.response.data;
  if (data instanceof Blob) {
    const text = await parseApiErrorPayload(await data.text());
    return text || "Export failed";
  }
  const text = await parseApiErrorPayload(data);
  return text || "Export failed";
}

function isExportTooLargeError(err: unknown): boolean {
  if (!isAxiosError(err) || !err.response) return false;
  if (err.response.status !== 400) return false;
  const data = err.response.data;
  if (typeof data === "object" && data !== null) {
    const code = (data as { code?: string }).code;
    if (code === "EXPORT_TOO_LARGE") return true;
  }
  return false;
}

const CouponExport = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [downloading, setDownloading] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportJobStatus | null>(null);
  const [batchMeta, setBatchMeta] = useState<BatchExportMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);

  const cached = JSON.parse(localStorage.getItem("couponData") || "{}");
  const totalCoupons = batchMeta?.totalCoupons ?? Number(cached?.quantity ?? 0);
  const isLargeBatch = batchMeta?.useAsyncExport ?? totalCoupons > COUPON_EXPORT_SYNC_MAX;

  const closePdfPreview = useCallback(() => {
    setPdfPreviewOpen(false);
    setPdfPreviewUrl((prev) => {
      if (prev) window.URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    const id = batchId?.trim();
    if (!id) {
      setMetaLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await api.get<BatchExportMeta>(
          `/coupons/batches/${encodeURIComponent(id)}/export/meta`,
        );
        if (!cancelled) setBatchMeta(res.data);
      } catch {
        /* fall back to cached quantity */
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) window.URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const handleDiscard = async () => {
    const result = await Swal.fire({
      title: "Discard this batch?",
      text: "You will leave export and return to Generate. Coupons remain in the system.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Discard",
      cancelButtonText: "Stay",
      confirmButtonColor: "#F26522",
    });
    if (!result.isConfirmed) return;
    localStorage.removeItem("couponData");
    navigate("/coupon-generation/form", { replace: true });
  };

  const runAsyncExport = useCallback(async (id: string, couponCount: number) => {
    const startRes = await api.post<ExportJobStatus>(
      `/coupons/batches/${encodeURIComponent(id)}/export/async`,
    );
    const jobId = startRes.data.jobId;
    if (!jobId) throw new Error("Export job could not be started");

    sessionStorage.setItem(exportJobStorageKey(id), jobId);

    setExportStatus({
      jobId,
      status: "processing",
      phase: "generating",
      progressPct: 0,
      processedCoupons: 0,
      totalCoupons: couponCount,
      ready: false,
      failed: false,
    });

    const finalStatus = await pollExportJobUntilReady(id, jobId, (status) => {
      setExportStatus(status);
    });

    setExportStatus({
      ...finalStatus,
      phase: "downloading",
      progressPct: 100,
      totalCoupons: couponCount,
    });

    const { fileSizeBytes } = await triggerBrowserZipDownload(id, jobId);

    sessionStorage.removeItem(exportJobStorageKey(id));

    await Swal.fire({
      title: "Download started",
      text: `Your browser is saving ${formatFileSize(fileSizeBytes)} (${couponCount.toLocaleString()} coupons). Check your Downloads folder.`,
      icon: "success",
      timer: 4000,
      showConfirmButton: false,
    });
  }, []);

  const fetchBatchPreviewHtml = async (): Promise<Blob> => {
    const id = batchId?.trim();
    if (!id) throw new Error("Batch id is missing. Please regenerate the batch and try again.");
    const html = await fetchCouponBatchPreviewHtml(id);
    return new Blob([html], { type: "text/html;charset=utf-8" });
  };

  const fetchBatchPdfBlob = async (): Promise<Blob> => {
    const id = batchId?.trim();
    if (!id) throw new Error("Batch id is missing. Please regenerate the batch and try again.");
    const res = await api.get<Blob>(
      `/coupons/batches/${encodeURIComponent(id)}/export.pdf`,
      { responseType: "blob", timeout: COUPON_PDF_REQUEST_TIMEOUT_MS },
    );
    return res.data instanceof Blob
      ? res.data
      : new Blob([res.data], { type: "application/pdf" });
  };

  const handleViewPdf = async () => {
    const id = batchId?.trim();
    if (!id) {
      await Swal.fire({
        title: "Preview failed",
        text: "Batch id is missing. Please regenerate the batch and try again.",
        icon: "error",
      });
      return;
    }

    setPdfPreviewLoading(true);
    try {
      const blob = await fetchBatchPreviewHtml();
      const url = window.URL.createObjectURL(blob);
      setPdfPreviewUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return url;
      });
      setPdfPreviewOpen(true);
    } catch (error) {
      const text = await exportErrorMessage(error);
      await Swal.fire({ title: "Preview failed", text, icon: "error" });
    } finally {
      setPdfPreviewLoading(false);
    }
  };

  const handleExportCoupons = async () => {
    const id = batchId?.trim();
    if (!id) {
      await Swal.fire({
        title: "Export failed",
        text: "Batch id is missing. Please regenerate the batch and try again.",
        icon: "error",
      });
      return;
    }

    if (!localStorage.getItem("accessToken")) {
      await Swal.fire({ title: "Export failed", text: "Not authenticated", icon: "error" });
      return;
    }

    setDownloading(true);
    setExportStatus(null);

    let meta = batchMeta;
    if (!meta) {
      try {
        const res = await api.get<BatchExportMeta>(
          `/coupons/batches/${encodeURIComponent(id)}/export/meta`,
        );
        meta = res.data;
        setBatchMeta(meta);
      } catch {
        meta = {
          batchId: id,
          totalCoupons,
          syncMax: COUPON_EXPORT_SYNC_MAX,
          useAsyncExport: totalCoupons > COUPON_EXPORT_SYNC_MAX,
        };
      }
    }

    const couponCount = meta.totalCoupons;
    const useAsync = meta.useAsyncExport;

    try {
      if (useAsync) {
        await runAsyncExport(id, couponCount);
        return;
      }

      try {
        const blob = await fetchBatchPdfBlob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `coupon-batch-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        await Swal.fire({
          title: "Success",
          text: "Coupon batch downloaded",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (syncErr) {
        if (isExportTooLargeError(syncErr)) {
          await runAsyncExport(id, couponCount || totalCoupons);
          return;
        }
        throw syncErr;
      }
    } catch (error) {
      const text = await exportErrorMessage(error, useAsync);
      await Swal.fire({ title: "Export failed", text, icon: "error" });
    } finally {
      setDownloading(false);
      setExportStatus(null);
    }
  };

  const downloadButtonLabel = downloading
    ? exportStatus
      ? overlayTitle(exportStatus)
      : "Preparing…"
    : isLargeBatch
      ? "Download ZIP"
      : "Download";

  const displayQuantity = totalCoupons || cached?.quantity;
  const displayPoints = cached?.points ?? 0;

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Preview Coupons" />
        <div className="min-h-screen bg-[#F5F6F8] p-6">
          <div className="max-w-6xl mx-auto p-8 space-y-6">
            <div className="flex items-center gap-2 text-gray-500 cursor-pointer mb-6">
              <button className="hover:bg-white rounded-full transition-colors text-[#1E2633]">
                <MdArrowBack size={22} onClick={() => navigate(-1)} className="cursor-pointer" />
              </button>
              <span className="text-[18px] font-semibold text-text-primary">Export Batch</span>
            </div>

            <h1 className="text-3xl font-bold text-[#1E2633] mb-6">
              Export Coupon <br /> Batch
            </h1>

            <div className="bg-white rounded-3xl shadow-sm p-8 mb-8 relative">
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Batch ID</p>
                  <p className="text-lg font-semibold text-[#1E2633]">#{batchId ?? cached?.batchId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Creation Date</p>
                  <p className="text-sm font-medium text-[#1E2633]">
                    {cached?.createdAt?.substring(0, 10) ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Total Coupons</p>
                  <p className="text-2xl font-bold text-[#1E2633]">
                    {metaLoading ? "…" : displayQuantity?.toLocaleString?.() ?? displayQuantity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-orange-500 uppercase font-semibold">Total Value</p>
                  <p className="text-3xl font-bold text-orange-600 tracking-wide">
                    {(Number(displayQuantity) * Number(displayPoints)).toLocaleString()} Pts
                  </p>
                </div>
              </div>
              <div className="absolute right-6 top-6 text-gray-200 text-5xl">
                <img src="/wallet.svg" alt="wallet" />
              </div>
            </div>

            {isLargeBatch ? (
              <p className="text-sm text-gray-500 text-center -mt-2 mb-2">
                Large batches export as a ZIP in the background. Keep this tab open — retry resumes from the last checkpoint.
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={pdfPreviewLoading || downloading || metaLoading}
                className="w-full border-2 border-orange-500 bg-white py-4 text-orange-600 rounded-full font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-orange-50 disabled:opacity-60 transition-colors"
                onClick={() => void handleViewPdf()}
              >
                <MdPictureAsPdf size={22} />
                {pdfPreviewLoading ? "Loading preview…" : "View PDF"}
              </button>

              <button
                type="button"
                disabled={downloading || pdfPreviewLoading || metaLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg"
                onClick={() => void handleExportCoupons()}
              >
                <BiDownload size={18} />
                {downloadButtonLabel}
              </button>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => void handleDiscard()}
              className="text-sm text-orange-500 font-medium hover:underline"
            >
              Cancel / Discard →
            </button>
          </div>
        </div>
      </div>

      <ExportProgressOverlay
        visible={downloading && isLargeBatch}
        progressPct={exportStatus?.progressPct ?? 0}
        phase={exportStatus?.phase}
        processedCoupons={exportStatus?.processedCoupons ?? 0}
        totalCoupons={exportStatus?.totalCoupons ?? totalCoupons}
        title={overlayTitle(exportStatus)}
        fileSizeBytes={exportStatus?.fileSizeBytes ?? undefined}
      />

      {pdfPreviewOpen && pdfPreviewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-preview-title"
          onClick={closePdfPreview}
        >
          <div
            className="flex h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#151515] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <h2 id="pdf-preview-title" className="text-base font-semibold text-white sm:text-lg">
                Coupon batch preview
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href={pdfPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-orange-400 hover:bg-white/10 sm:inline-block"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={closePdfPreview}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close preview"
                >
                  <MdClose size={24} />
                </button>
              </div>
            </div>
            <iframe
              title="Coupon batch preview"
              src={pdfPreviewUrl}
              className="min-h-0 w-full flex-1 border-0 bg-[#151515]"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CouponExport;
