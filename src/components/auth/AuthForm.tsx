// components/auth/AuthForm.tsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import OtpInput from "../ui/OtpInput";
import { useFormik } from "formik";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { normalizeLocalPhoneDigits } from "../../utils/phone";

const AuthForm = () => {
  const [step, setStep] = useState<"request" | "verify">("request");
  /** Match mobile: default Ops; Super shows OTP + account password. */
  const [isAdminType, setIsAdminType] = useState<"super" | "management">(
    "management",
  );
  const [otpValue, setOtpValue] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [bootstrapAllowed, setBootstrapAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/auth/superadmin/bootstrap-available`)
      .then((r) => setBootstrapAllowed(r.data?.allowed === true))
      .catch(() => setBootstrapAllowed(false));
  }, []);

  const formik = useFormik({
    initialValues: {
      countryCode: "+91",
      phone: "",
    },

    onSubmit: async (values) => {
      if (step === "request") {
        const phoneDigits = normalizeLocalPhoneDigits(
          values.phone,
          values.countryCode,
        );
        if (phoneDigits.length !== 10) {
          toast.error(
            "Enter your 10-digit mobile (without +91 — country is already selected).",
          );
          return;
        }
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/otp/request`,
            {
              countryCode: values.countryCode.trim(),
              phone: phoneDigits,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (res.status === 201 || res.status === 200) {
            toast.success("OTP Sent Successfully");

            if (res.data && res.data.devCode) {
              setOtpValue(String(res.data.devCode));
            }
            setAdminPassword("");
            setStep("verify");
          }
        } catch (error) {
          console.error("REQUEST ERROR ", error);
          let errorMessage = "Failed to send OTP";
          if (axios.isAxiosError(error)) {
            if (!error.response) {
              errorMessage =
                error.code === "ERR_NETWORK" ||
                error.message === "Network Error"
                  ? "Cannot reach the API from the browser. On production, set CORS_ORIGINS on the server to include this site (e.g. https://admin.bestbond.in) and redeploy."
                  : errorMessage;
            } else {
              const m = error.response.data?.message;
              errorMessage = Array.isArray(m) ? m.join(" ") : m ?? errorMessage;
            }
          }
          toast.error(errorMessage);
        }
      } else {
        if (isAdminType === "super" && adminPassword.trim().length < 8) {
          toast.error("Enter your account password (min 8 characters).");
          return;
        }
        try {
          const phoneDigits = normalizeLocalPhoneDigits(
            values.phone,
            values.countryCode,
          );
          if (phoneDigits.length !== 10 || otpValue.length !== 6) {
            toast.error("Enter a valid mobile number and 6-digit OTP.");
            return;
          }
          const body: Record<string, string> = {
            countryCode: values.countryCode.trim(),
            phone: phoneDigits,
            code: otpValue,
          };
          if (isAdminType === "super") {
            body.password = adminPassword.trim();
          }
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/admin/otp/login`,
            body,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (res.status === 201 || res.status === 200) {
            toast.success("Login Successful");
            localStorage.setItem("accessToken", res?.data?.accessToken);
            localStorage.setItem(
              "userRole",
              JSON.stringify(res?.data?.roles || [])
            );
            localStorage.setItem(
              "userPermissions",
              JSON.stringify(res?.data?.permissions ?? []),
            );
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("VERIFY ERROR ", error);
          let errorMessage = "Login failed";
          if (axios.isAxiosError(error)) {
            const m = error.response?.data?.message;
            const raw =
              typeof m === "string"
                ? m
                : Array.isArray(m)
                  ? m.join(" ")
                  : "";
            // Same as mobile: Ops flow but this phone is Super Admin — show password.
            if (
              isAdminType === "management" &&
              /password is required for super admin/i.test(raw)
            ) {
              setIsAdminType("super");
              toast.info(
                "This mobile number is a Super Admin account. Enter your password below.",
              );
              return;
            }
            errorMessage = Array.isArray(m) ? m.join(" ") : m ?? errorMessage;
          }
          toast.error(errorMessage);
        }
      }
    },
  });

  return (
    <>
      <ToastContainer />
      <form onSubmit={formik.handleSubmit} className="space-y-8 px-4">
        <div className="space-y-1">
          <h1 className="text-[56px] font-bold font-bricolage leading-14">
            <span className="text-text-muted/30 block mb-1">Welcome to</span>
            <span className="text-text-primary">
              {isAdminType === "super" ? "Super Admin" : "Management"}
            </span>
          </h1>
          <p className="text-text-primary text-[16px] font-medium tracking-wide">
            {step === "request"
              ? "Verify and Sign In to assess your rewards."
              : isAdminType === "super"
                ? "Super Admin: enter OTP and your account password (8+ characters)."
                : "Ops Admin: enter OTP only — no account password."}
          </p>
        </div>

        {/* Match mobile: Ops vs Super always available */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsAdminType("management");
              setAdminPassword("");
            }}
            className={`flex-1 py-3 rounded-xl border-[1.5px] text-[15px] font-bold transition-colors ${
              isAdminType === "management"
                ? "border-brand-orange bg-[#FFF7F0] text-brand-orange"
                : "border-border text-text-secondary bg-white"
            }`}
          >
            Ops Admin
          </button>
          <button
            type="button"
            onClick={() => setIsAdminType("super")}
            className={`flex-1 py-3 rounded-xl border-[1.5px] text-[15px] font-bold transition-colors ${
              isAdminType === "super"
                ? "border-brand-orange bg-[#FFF7F0] text-brand-orange"
                : "border-border text-text-secondary bg-white"
            }`}
          >
            Super Admin
          </button>
        </div>

        <div className="space-y-6">
          {step === "request" ? (
            <InputField
              label="Enter Mobile"
              placeholder="Enter Mobile"
              type="tel"
              name="phone"
              value={formik.values.phone}
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              onChange={(e) => {
                const digitsOnly = normalizeLocalPhoneDigits(
                  e.target.value,
                  formik.values.countryCode,
                );
                formik.setFieldValue("phone", digitsOnly);
              }}
            />
          ) : (
            <div className="space-y-4">
              <label className="text-[12px] font-semibold text-text-secondary tracking-wider uppercase ml-1">
                Verification Code
              </label>
              <div className="flex justify-center">
                <OtpInput
                  length={6}
                  value={otpValue}
                  onChange={(val) => setOtpValue(val)}
                />
              </div>
              {isAdminType === "super" ? (
                <div className="space-y-2 rounded-2xl border border-border bg-white/80 p-4">
                  <label className="text-[12px] font-semibold text-text-secondary tracking-wider uppercase ml-1">
                    Account password
                  </label>
                  <p className="text-xs text-text-secondary -mt-1 mb-1">
                    The password you set for this Super Admin account.
                  </p>
                  <input
                    name="adminPassword"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Min 8 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border outline-none focus:ring-1 focus:ring-brand-orange text-sm placeholder:text-text-muted"
                  />
                </div>
              ) : null}
              <p className="text-sm text-center text-text-secondary">
                Didn&apos;t receive code?{" "}
                <span
                  onClick={() => setStep("request")}
                  className="text-brand-orange font-bold cursor-pointer hover:underline"
                >
                  Resend
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="py-4 space-y-4">
          <Button type="submit">
            {step === "request" ? "Get OTP" : "Verify OTP"}
          </Button>

          {step === "request" && bootstrapAllowed ? (
            <p className="text-center text-sm text-text-secondary">
              New environment?{" "}
              <Link
                to="/bootstrap-superadmin"
                className="text-brand-orange font-bold hover:underline"
              >
                First-time Super Admin setup
              </Link>
            </p>
          ) : null}
        </div>

        <p className="text-[14px] font-medium text-text-secondary tracking-wide text-center leading-5 max-w-[300px] mx-auto">
          By logging in, you agree to our{" "}
          <span className="text-brand-orange hover:underline cursor-pointer">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-brand-orange hover:underline cursor-pointer">
            Privacy Policy
          </span>
        </p>
      </form>
    </>
  );
};

export default AuthForm;
