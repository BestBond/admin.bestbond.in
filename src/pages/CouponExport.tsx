import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { BiDownload } from "react-icons/bi";
import { MdArrowBack, MdClose, MdPictureAsPdf } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useCallback, useEffect, useState } from "react";

async function exportErrorMessage(err: unknown): Promise<string> {
  if (!axios.isAxiosError(err) || !err.response?.data) {
    return String((err as Error)?.message ?? "Export failed");
  }
  const data = err.response.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const j = JSON.parse(text) as { message?: string };
        return (j.message ?? text) || "Export failed";
      } catch {
        return text || "Export failed";
      }
    } catch {
      return "Export failed";
    }
  }
  if (typeof data === "object" && data !== null && "message" in data) {
    return String((data as { message: string }).message);
  }
  return "Export failed";
}

const CouponExport = () => {
  const navigate = useNavigate()
  const { batchId } = useParams();
  const [downloading, setDownloading] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);

  const data = JSON.parse(localStorage.getItem("couponData") || "{}")

  const closePdfPreview = useCallback(() => {
    setPdfPreviewOpen(false);
    setPdfPreviewUrl((prev) => {
      if (prev) window.URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) window.URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const fetchBatchPdfBlob = async (): Promise<Blob> => {
    const id = batchId?.trim();
    if (!id) {
      throw new Error("Batch id is missing. Please regenerate the batch and try again.");
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Not authenticated");
    }
    const res = await axios.get<Blob>(
      `${import.meta.env.VITE_API_URL}/coupons/batches/${encodeURIComponent(id)}/export.pdf`,
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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
      const blob = await fetchBatchPdfBlob();
      const url = window.URL.createObjectURL(blob);
      setPdfPreviewUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return url;
      });
      setPdfPreviewOpen(true);
    } catch (error) {
      const text = await exportErrorMessage(error);
      await Swal.fire({
        title: "Preview failed",
        text,
        icon: "error",
      });
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

    const token = localStorage.getItem("accessToken");
    if (!token) {
      await Swal.fire({
        title: "Export failed",
        text: "Not authenticated",
        icon: "error",
      });
      return;
    }

    setDownloading(true);
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
    } catch (error) {
      const text = await exportErrorMessage(error);
      await Swal.fire({
        title: "Export failed",
        text,
        icon: "error",
      });
    } finally {
      setDownloading(false);
    }
  };


  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Preview Coupons" />
        <div className="min-h-screen bg-[#F5F6F8] p-6">

          <div className="max-w-6xl mx-auto p-8 space-y-6">

            {/* Header */}
            <div className="flex items-center gap-2 text-gray-500 cursor-pointer mb-6">
              <button
                className="hover:bg-white rounded-full transition-colors text-[#1E2633]"
              >
                <MdArrowBack size={22} onClick={() => navigate(-1)} className="cursor-pointer" />
              </button>
              <span className="text-[18px] font-semibold text-text-primary">Export Batch</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-[#1E2633] mb-6">
              Export Coupon <br /> Batch
            </h1>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-sm p-8 mb-8 relative">

              <div className="space-y-6">

                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Batch ID</p>
                  <p className="text-lg font-semibold text-[#1E2633]">#{data?.batchId}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Creation Date</p>
                  <p className="text-sm font-medium text-[#1E2633]">{data?.createdAt?.substring(0, 10)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Total Coupons</p>
                  <p className="text-2xl font-bold text-[#1E2633]">{data?.quantity}</p>
                </div>

                <div>
                  <p className="text-xs text-orange-500 uppercase font-semibold">Total Value</p>
                  <p className="text-3xl font-bold text-orange-600 tracking-wide">{data?.quantity * data?.points} Pts</p>
                </div>

              </div>

              {/* Right Icon */}
              <div className="absolute right-6 top-6 text-gray-200 text-5xl">
                <img src="/wallet.svg" alt="wallet" />
              </div>
            </div>

            {/* Format Selection */}
            {/* <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase font-semibold mb-4">
          Select Export Format
        </p>

        <div
          className="w-full py-4 px-4 rounded-full border-2 border-orange-500 bg-orange-50 text-orange-600 text-sm font-semibold text-center"
          role="status"
        >
          PDF (Print Ready)
        </div>
      </div> */}

            {/* View PDF + Download */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={pdfPreviewLoading || downloading}
                className="w-full border-2 border-orange-500 bg-white py-4 text-orange-600 rounded-full font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-orange-50 disabled:opacity-60 transition-colors"
                onClick={() => {
                  void handleViewPdf();
                }}
              >
                <MdPictureAsPdf size={22} />
                {pdfPreviewLoading ? "Loading preview…" : "View PDF"}
              </button>

              <button
                type="button"
                disabled={downloading || pdfPreviewLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg"
                onClick={() => {
                  void handleExportCoupons();
                }}
              >
                <BiDownload size={18} />
                {downloading ? "Downloading…" : "Download"}
              </button>
            </div>
          </div>

          {/* Cancel */}
          <div className="text-center mt-4">
            <button className="text-sm text-orange-500 font-medium hover:underline">
              Cancel / Discard →
            </button>
          </div>

        </div>
      </div>

      {pdfPreviewOpen && pdfPreviewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-preview-title"
          onClick={closePdfPreview}
        >
          <div
            className="flex h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
              <h2 id="pdf-preview-title" className="text-base font-semibold text-[#1E2633] sm:text-lg">
                Coupon batch preview
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href={pdfPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 sm:inline-block"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={closePdfPreview}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#1E2633]"
                  aria-label="Close PDF preview"
                >
                  <MdClose size={24} />
                </button>
              </div>
            </div>
            <iframe
              title="Coupon batch PDF preview"
              src={pdfPreviewUrl}
              className="min-h-0 w-full flex-1 border-0 bg-gray-100"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CouponExport;