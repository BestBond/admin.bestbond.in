import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { BiDownload } from "react-icons/bi";
import { MdArrowBack } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useState } from "react";

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

  const data = JSON.parse(localStorage.getItem("couponData") || "{}")


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
      // Match mobile: GET .../coupons/batches/:batchId/export.pdf with Bearer only (binary body).
      const res = await axios.get<Blob>(
        `${import.meta.env.VITE_API_URL}/coupons/batches/${encodeURIComponent(id)}/export.pdf`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const blob =
        res.data instanceof Blob
          ? res.data
          : new Blob([res.data], { type: "application/pdf" });
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
                  <p className="text-3xl font-bold text-[#1E2633]">{data?.totalCoupons}</p>
                </div>

                <div>
                  <p className="text-xs text-orange-500 uppercase font-semibold">Total Value</p>
                  <p className="text-2xl font-bold text-orange-600">{data?.totalPoints} Pts</p>
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

            {/* Download Button */}
            <button
              type="button"
              disabled={downloading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg"
              onClick={handleExportCoupons}
            >
              <BiDownload size={18} />
              {downloading ? "Downloading…" : "Download"}
            </button>
          </div>

          {/* Cancel */}
          <div className="text-center mt-4">
            <button className="text-sm text-orange-500 font-medium hover:underline">
              Cancel / Discard →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CouponExport;