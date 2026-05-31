import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { useCallback, useEffect, useState } from "react";
import api from "../utils/api";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { MdClose, MdContentCopy } from "react-icons/md";
import CouponPrintPreviewFrame from "../components/coupons/CouponPrintPreviewFrame";
import {
  fetchCouponBatchPreviewHtml,
  fetchCouponFacePreviewHtml,
} from "../utils/couponPreview";

type Coupon = {
  id: string | number;
  code: string;
  points?: number;
};

type CouponBatchData = {
  items?: Coupon[];
  quantity?: number;
  points?: number;
  [key: string]: unknown;
};

type CouponMeta = {
  batchId: string;
  quantity?: number;
  points?: number;
};

const getCachedCouponMeta = (batchId: string): CouponMeta | null => {
  try {
    const cached = JSON.parse(localStorage.getItem("couponData") || "{}") as unknown;
    if (!cached || typeof cached !== "object") return null;

    const meta = cached as Partial<CouponMeta>;
    return meta.batchId === batchId
      ? {
          batchId,
          quantity: meta.quantity,
          points: meta.points,
        }
      : null;
  } catch {
    return null;
  }
};

const CouponPreview = () => {
  const [data, setData] = useState<CouponBatchData | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [batchPreviewHtml, setBatchPreviewHtml] = useState<string | null>(null);
  const [batchPreviewLoading, setBatchPreviewLoading] = useState(false);
  const [facePreviewHtml, setFacePreviewHtml] = useState<string | null>(null);
  const [facePreviewLoading, setFacePreviewLoading] = useState(false);
  const { batchId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchListBatchCoupon() {
      if (!batchId) return;
      try {
        const res = await api.get<CouponBatchData>(
          `/coupons/batches/${encodeURIComponent(batchId)}?take=50&offset=0`,
        );
        const meta = getCachedCouponMeta(batchId);
        setData({
          ...res.data,
          quantity: meta?.quantity ?? res.data?.items?.length,
          points: meta?.points ?? res.data?.items?.[0]?.points,
        });
      } catch (error) {
        console.error("FETCH BATCH COUPON ERROR", error);
      }
    }
    void fetchListBatchCoupon();
  }, [batchId]);

  const loadBatchPrintPreview = useCallback(async () => {
    const id = batchId?.trim();
    if (!id) return;
    setBatchPreviewLoading(true);
    try {
      setBatchPreviewHtml(await fetchCouponBatchPreviewHtml(id));
    } catch (error) {
      console.error("BATCH PREVIEW ERROR", error);
      setBatchPreviewHtml(null);
    } finally {
      setBatchPreviewLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void loadBatchPrintPreview();
  }, [loadBatchPrintPreview]);

  useEffect(() => {
    const id = batchId?.trim();
    const code = selectedCoupon?.code?.trim();
    if (!id || !code) {
      setFacePreviewHtml(null);
      return;
    }

    let cancelled = false;
    setFacePreviewLoading(true);
    void fetchCouponFacePreviewHtml(id, code)
      .then((html) => {
        if (!cancelled) setFacePreviewHtml(html);
      })
      .catch((error) => {
        console.error("FACE PREVIEW ERROR", error);
        if (!cancelled) setFacePreviewHtml(null);
      })
      .finally(() => {
        if (!cancelled) setFacePreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [batchId, selectedCoupon]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    Swal.fire({
      title: "Copied!",
      text: "Coupon code copied to clipboard",
      icon: "success",
      timer: 1000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  };

  const handleDiscard = async () => {
    const result = await Swal.fire({
      title: "Discard this batch?",
      text: "Coupons are already generated. You will leave preview and return to Generate.",
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

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Preview Coupons" />

        <div className="p-8 space-y-8">
          <div className="space-y-8">
            <div className="bg-orange-light rounded-br-[40px] rounded-tr-[40px] p-10 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-orange-dark" />
              <div className="space-y-1">
                <p className="text-[14px] font-bold text-text-primary uppercase tracking-widest">
                  No of Coupons
                </p>
                <p className="text-[44px] font-bold text-text-primary">{data?.quantity}</p>
                <p className="text-[18px] font-semibold text-secondary">Coupons Generated</p>
              </div>
              <div className="bg-white text-text-primary px-3 py-2.5 rounded-[24px] text-[14px] font-semibold mt-5 w-50 text-center flex items-center gap-3 font-bricolage">
                <img src="/cards_star_light.svg" alt="" />
                <span>Value:{data?.points} Pts each</span>
              </div>
            </div>

            <div className="w-full mt-4">
              <p className="text-sm font-semibold text-gray-500 mb-4">
                Live Preview (same as PDF)
              </p>

              <div className="bg-[#151515] rounded-3xl p-4 sm:p-6 overflow-hidden">
                <CouponPrintPreviewFrame
                  html={batchPreviewHtml}
                  loading={batchPreviewLoading}
                  title="Coupon batch print preview"
                  className="w-full min-h-[320px] max-h-[min(70vh,720px)] border-0 bg-[#151515]"
                />
              </div>

              <div className="bg-white rounded-3xl p-5 mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Coupon codes — tap to preview
                </p>
                <div className="max-h-[280px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {data?.items?.map((coupon) => (
                    <div
                      key={coupon.id}
                      onClick={() => setSelectedCoupon(coupon)}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer transition-all ${
                        selectedCoupon?.code === coupon.code
                          ? "bg-orange-50 ring-2 ring-orange-400"
                          : "bg-white shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-text-muted/10 rounded-full">
                          <img src="/qr_code_2.svg" alt="" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary tracking-wide">
                            {coupon.code}
                          </p>
                          <p className="text-[10px] font-normal text-secondary tracking-widest">
                            {data?.points ?? coupon.points} Points
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCopy(coupon.code);
                        }}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-[#F26522] transition-all active:scale-90"
                      >
                        <MdContentCopy size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6">
              <button
                type="button"
                onClick={() => {
                  void handleDiscard();
                }}
                className="text-gray-400 font-medium hover:text-secondary transition-colors px-10 py-5 rounded-full hover:bg-gray-100"
              >
                Cancel/Discard
              </button>
              <div className="flex gap-4">
                <Link
                  to={`/coupon-generation/export/${batchId}`}
                  className="bg-primary hover:bg-brand-orange-dark text-white px-22 py-2 rounded-full font-medium text-[14px] flex items-center gap-4 transition-all shadow-xl shadow-[#F26522]/30 hover:scale-105 active:scale-95"
                >
                  Confirm
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedCoupon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6"
          onClick={() => setSelectedCoupon(null)}
        >
          <div
            className="relative mx-auto w-full max-w-[min(96vw,520px)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedCoupon(null)}
              className="absolute right-0 top-0 z-[60] flex h-10 w-10 -translate-y-[calc(100%+10px)] items-center justify-center rounded-full bg-white text-gray-500 shadow-lg ring-1 ring-black/10 transition-all hover:bg-gray-100 hover:text-text-primary sm:h-11 sm:w-11"
              aria-label="Close coupon preview"
            >
              <MdClose size={22} />
            </button>

            <CouponPrintPreviewFrame
              html={facePreviewHtml}
              loading={facePreviewLoading}
              title={`Coupon ${selectedCoupon.code} print preview`}
              className="w-full min-h-[160px] border-0 bg-[#151515] rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponPreview;
