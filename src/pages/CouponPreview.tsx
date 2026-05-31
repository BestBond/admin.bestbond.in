import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { useEffect, useState } from "react";
import api from "../utils/api";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { MdClose, MdContentCopy } from "react-icons/md";
import GeneratedCouponCard from "../components/coupons/GeneratedCouponCard";

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
        return meta.batchId === batchId ? {
            batchId,
            quantity: meta.quantity,
            points: meta.points,
        } : null;
    } catch {
        return null;
    }
};

const CouponPreview = () => {
const [data , setData] = useState<CouponBatchData | null>(null)
const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const { batchId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchListBatchCoupon(){
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


    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        Swal.fire({
            title: "Copied!",
            text: "Coupon code copied to clipboard",
            icon: "success",
            timer: 1000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
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
                        <div className="bg-orange-light rounded-br-[40px] rounded-tr-[40px] p-10 shadow-sm border border-gray-100 flex flex-col  relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-1.5 h-full bg-orange-dark"></div>
                            <div className="space-y-1">
                                <p className="text-[14px] font-bold text-text-primary uppercase tracking-widest">No of Coupons</p>
                                <p className="text-[44px] font-bold  text-text-primary">{data?.quantity}</p>
                                <p className="text-[18px] font-semibold text-secondary ">Coupons Generated</p>
                            </div>
                            <div className="bg-white text-text-primary px-3 py-2.5 rounded-[24px] text-[14px] font-semibold mt-5 w-50 text-center flex items-center gap-3 font-bricolage">
                                <img src="/cards_star_light.svg" alt="cards_star_light " />   <span>Value:{data?.points} Pts each</span>
                            </div>
                        </div>

                        <div className="w-full mt-4 ">
                            {/* Title */}
                            <p className="text-sm font-semibold text-gray-500 mb-4">Live Preview</p>

                            {/* Main Card */}
                            <div className="bg-white rounded-3xl p-5">

                                {/* Scrollable List */}
                                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">

                                    {data?.items?.map((coupon) => (
                                        <div
                                            key={coupon.id}
                                            onClick={() => setSelectedCoupon(coupon)}
                                            className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                        >
                                            {/* Left Section */}
                                            <div className="flex items-center gap-4">

                                                {/* Icon Circle */}
                                                <div className="w-10 h-10 flex items-center justify-center bg-text-muted/10 rounded-full text-gray-500">
                                                    <img src="/qr_code_2.svg" alt="qr_code_2" />
                                                </div>

                                                {/* Text */}
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary tracking-wide">
                                                        {coupon.code}
                                                    </p>
                                                    <p className="text-[10px] font-normal text-secondary tracking-widest">
                                                        Active Batch #{coupon.points}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Copy Button */}
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
                                    className="bg-primary hover:bg-brand-orange-dark text-white px-22 py-2 rounded-full font-medium text-[14px] flex items-center gap-4 transition-all shadow-xl shadow-[#F26522]/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6"
                    onClick={() => setSelectedCoupon(null)}
                >
                    <div
                        className="relative mx-auto w-full max-w-[min(96vw,920px)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedCoupon(null)}
                            className="absolute right-4 top-0 z-[60] flex h-10 w-10 -translate-y-[calc(100%+10px)] items-center justify-center rounded-full bg-white text-gray-500 shadow-lg ring-1 ring-black/10 transition-all hover:bg-gray-100 hover:text-text-primary sm:right-5 sm:-translate-y-[calc(100%+12px)] sm:h-11 sm:w-11"
                            aria-label="Close coupon preview"
                        >
                            <MdClose size={22} />
                        </button>

                        <GeneratedCouponCard
                            couponId={String(selectedCoupon.id ?? selectedCoupon.code)}
                            couponCode={selectedCoupon.code}
                            points={Number(selectedCoupon.points ?? data?.points ?? 0)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponPreview;
