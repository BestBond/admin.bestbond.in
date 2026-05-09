import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { MdArrowBack } from "react-icons/md";
import { HiInformationCircle } from "react-icons/hi";
import { GenerateIcon } from "../components/ui/Icons";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import '../App.css'

const tierOptions = [
  { value: 500, label: "Select Value: 500 Pts" },
  { value: 1000, label: "Select Value: 1000 Pts" },
  { value: 2000, label: "Select Value: 2000 Pts" },
  { value: 5000, label: "Select Value: 5000 Pts" },
];

const CouponGeneration = () => {
  const [tierValue, setTierValue] = useState<number>(1000);
  const [quantity, setQuantity] = useState<number | "">(100);
  const [title] = useState<string>("Bulk Coupon Generation");
  const [loading, setLoading] = useState(false);

  const totalValue = tierValue * (Number(quantity) || 0);

  const navigate = useNavigate()

  useEffect(() => {
    const fetchActiveCount = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/coupons`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: 'ACTIVE', take: 1 }
        });
        // Assuming the API returns an array or an object with total count
        // For now, let's just use the length or a mock if not available
        if (Array.isArray(res.data)) {
          // If the API doesn't return total count, we might need a separate endpoint
          // But for now let's just set it to a realistic number or null
        }
      } catch (error) {
        console.error("FETCH COUNT ERROR", error);
      }
    };
    fetchActiveCount();
  }, []);

  const handleGenerate = async () => {
    if (!tierValue || !quantity || Number(quantity) <= 0) {
      Swal.fire({
        title: "Validation Error",
        text: "Please select a slab value and enter a valid quantity.",
        icon: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/coupons/generate`,
        {
          title,
          points: tierValue,
          quantity: Number(quantity),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 201) {
        localStorage.setItem("couponData", JSON.stringify(res?.data));
        navigate(`/coupon-generation/preview/${res?.data?.batchId}`);

        Swal.fire({
          title: "Success!!",
          text: `${quantity} Coupons Generated Successfully`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error("GENERATION ERROR", error);
      let errorMessage = "Failed to generate coupons";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Generate Coupons" />

        <div className="p-8 max-w-6xl mx-auto w-full">
          {/* Back Button & Header */}
          <div className="flex items-center gap-3 mb-8 -ml-8">
            <button
              className="hover:bg-white rounded-full transition-colors text-[#1E2633]"
            >
              <MdArrowBack size={22}  onClick={()=> navigate(-1)} className="cursor-pointer"/>
            </button>
            <h2 className="text-xl font-bold text-[#1E2633] font-bricolage">Generate Coupons</h2>
          </div>

          {/* Step 1: Form */}
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-secondary text-[16px] leading-relaxed max-w-2xl ">
                  Define the parameters for your new industrial coupon batch. Values are calculated instantly.
                </p>
              </div>

              <div className="space-y-10">
                {/* Slab Value */}
                <div className="space-y-4">
                  <label className="text-[14px] font-medium text-text-primary uppercase tracking-wide ">
                    COUPON TIER VALUE
                  </label>

                  <Select
                    options={tierOptions}
                    value={tierOptions.find((opt) => opt.value === tierValue)}
                    onChange={(selected : any) => setTierValue(selected.value)}
                    className="w-full bg-[#EEF0F4] border-none  text-text-primary text-sm  focus:ring-2 focus:ring-[#F26522]/20 outline-none placeholder:text-secondary/90 rounded-2xl mt-3"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: "#EEF0F4",
                        borderRadius: "1rem",
                        padding: "12px 20px",
                        border: "none",
                        boxShadow: "none",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: "1rem",
                        overflow: "hidden",
                        background:"#fff",
                      }),
                    }}
                  />
                </div>

                {/* Number of Coupons */}
                <div className="space-y-4">
                  <label className="text-[14px] font-medium text-text-primary uppercase tracking-wide">NUMBER OF COUPONS</label>
                  <div className="relative mt-3">
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Enter Quantity"
                      className="w-full bg-[#EEF0F4] border-none rounded-2xl px-6 py-5 text-[#1E2633] text-sm focus:ring-2 focus:ring-[#F26522]/20 outline-none placeholder:text-gray-400"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold uppercase text-xs tracking-widest">
                      Units
                    </div>
                  </div>
                </div>

                {/* Total Value Summary Card */}
                <div className="bg-white border border-border rounded-[48px] p-10 space-y-8 shadow-sm">
                  <div className="space-y-2">
                    <p className="text-[14px] font-bold text-secondary uppercase tracking-[1px]">TOTAL VALUE OF THE BATCH</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[44px]  text-text-primary font-bold -tracking-[3px] font-bricolage">
                        {totalValue.toLocaleString()}
                      </span>
                      <span className="text-lg font-bold text-secondary uppercase tracking-wide">PTS</span>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-[#EFF4FF] rounded-full p-4 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                      <HiInformationCircle className="text-brand-orange-dark" size={24} />
                    </div>
                    <p className="text-secondary text-[14px] leading-relaxed font-medium ">
                      Generating this batch will authorize <span className="text-text-primary font-medium">{Number(quantity).toLocaleString() || 0} unique codes</span> to be distributed via the partner portal.
                    </p>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !tierValue || !quantity || Number(quantity) <= 0}
                    className="bg-primary hover:bg-brand-orange-dark text-white px-12 py-3 rounded-full font-semibold text-lg flex items-center gap-4 transition-all shadow-xl shadow-[#F26522]/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <GenerateIcon size={24} color="white" />
                    )}
                    {loading ? "Generating Batch..." : "Generate Batch"}
                  </button>
                </div>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default CouponGeneration;
