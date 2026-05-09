import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import OtpInput from "../ui/OtpInput";
import api, { isAxiosError } from "../../utils/api";

const RegistrationForm = ({ onPending }: { onPending: () => void }) => {
  const [step, setStep] = useState<"register" | "pending">("register");
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      countryCode: "+91",
      phone: "",
    },
    validate: (values) => {
      const errors: any = {};
      
      if (!values.fullName) {
        errors.fullName = "Full name is required";
      } else if (values.fullName.length > 50) {
        errors.fullName = "Name is too long (max 50 characters)";
      }

      if (!values.email) {
        errors.email = "Email address is required";
      } else if (values.email.length > 50) {
        errors.email = "Email is too long (max 50 characters)";
      }

      if (!values.phone) {
        errors.phone = "Mobile number is required";
      } else if (!/^[0-9]{10}$/.test(values.phone)) {
        errors.phone = "Enter a valid 10-digit number";
      }

      if (!values.countryCode) {
        errors.countryCode = "Code required";
      } else if (values.countryCode.length < 1 || values.countryCode.length > 5) {
        errors.countryCode = "Invalid code";
      }

      return errors;
    },
    onSubmit: async (values) => {
      if (!otpValue || otpValue.length < 6) {
        toast.error("Please enter a valid OTP");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await api.post("/auth/admin/otp/signup", {
          countryCode: values.countryCode,
          phone: values.phone,
          code: otpValue,
          fullName: values.fullName,
          email: values.email,
        });

        if (res.status === 201) {
          if (res.data?.pendingApproval) {
            setStep("pending");
            onPending();
          } else {
            toast.success("Registration Successful!");
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("SIGNUP ERROR", error);
        let errorMessage = "Failed to register";
        if (isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
        }
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleVerifyPhone = async () => {
    if (!formik.values.phone || formik.values.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.post("/auth/otp/request", {
        countryCode: formik.values.countryCode,
        phone: formik.values.phone,
      });

      if (res.status === 201) {
        toast.success("OTP Sent Successfully");
        setIsVerified(true);
        if (res.data && res.data.devCode) {
          setOtpValue(res.data.devCode);
        }
      }
    } catch (error) {
      console.error("OTP REQUEST ERROR", error);
      let errorMessage = "Failed to send OTP";
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  if (step === "pending") {
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-2">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center shadow-inner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12L15 15" stroke="#F26522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="9" stroke="#F26522" strokeWidth="2"/>
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-[#1E2633] tracking-tight font-bricolage">
            Waiting for Super Admin approval
          </h2>
          <p className="text-gray-400 text-base font-medium leading-relaxed max-w-xs mx-auto">
            Your Ops Admin account is created. Once the Super Admin approves it, you can log in and access management dashboards.
          </p>
        </div>

        <div className="w-full space-y-3 pt-4">
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-[#F26522] text-white py-4 rounded-full font-bold text-lg shadow-xl shadow-[#F26522]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Back to Login
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="w-full bg-white border-2 border-gray-100 text-gray-400 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-5xl font-black text-[#1E2633] tracking-tight font-bricolage">
          Complete Your Profile
        </h1>
        <p className="text-gray-400 text-lg font-medium">
          Let's get started once you fill the details for your profile
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <InputField
            label="FULL NAME"
            placeholder="Enter your full Name"
            name="fullName"
            value={formik.values.fullName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.fullName}
            touched={formik.touched.fullName}
          />

          <InputField
            label="EMPLOYEE ID / OFFICIAL EMAIL"
            placeholder="Enter your ID / Email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.email}
            touched={formik.touched.email}
          />

          <div className="space-y-1 relative">
            <InputField
              label="MOBILE NUMBER"
              placeholder="Enter Mobile"
              type="tel"
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.phone}
              touched={formik.touched.phone}
            />
            <button
              type="button"
              onClick={handleVerifyPhone}
              disabled={isVerifying || !formik.values.phone || !!formik.errors.phone}
              className={`absolute right-4 ${formik.errors.phone && formik.touched.phone ? 'bottom-5' : 'bottom-3'} text-brand-orange font-bold text-sm uppercase tracking-widest hover:underline disabled:opacity-50 transition-all`}
            >
              {isVerifying ? "Sending..." : "Verify"}
            </button>
          </div>

          <div className="space-y-4 pt-2">
            <label className={`text-[12px] font-bold uppercase tracking-[0.2em] ml-1 transition-colors ${!isVerified ? 'text-gray-300' : 'text-gray-400'}`}>
              Verification Code
            </label>
            <div className={`flex justify-center transition-opacity ${!isVerified ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <OtpInput
                length={6}
                value={otpValue}
                onChange={(val) => setOtpValue(val)}
              />
            </div>
          </div>
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={isSubmitting || !otpValue || otpValue.length < 6 || Object.keys(formik.errors).length > 0 || !formik.values.fullName || !formik.values.email}
            className="w-full bg-[#F26522] text-white py-6 rounded-full font-bold text-xl shadow-2xl shadow-[#F26522]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Save and Continue
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
