// components/auth/AuthForm.tsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import OtpInput from "../ui/OtpInput";
import { useFormik } from "formik";
import api, { isAxiosError } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { normalizeLocalPhoneDigits } from "../../utils/phone";
import { BsEye, BsEyeSlashFill } from "react-icons/bs";

const AuthForm = () => {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [showPassword, setShowPassword] = useState(false);

  /** Match mobile: default Ops; Super shows OTP + account password. */
  const [isAdminType, setIsAdminType] = useState<"super" | "management">(
    "management",
  );
  const [otpValue, setOtpValue] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [bootstrapAllowed, setBootstrapAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/auth/superadmin/bootstrap-available")
      .then((r) => setBootstrapAllowed(r.data?.allowed === true))
      .catch(() => setBootstrapAllowed(false));
  }, []);

  const formik = useFormik({
    initialValues: {
      countryCode: "+91",
      phone: "",
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.phone) {
        errors.phone = "Mobile number is required";
      } else if (!/^[0-9]{10}$/.test(values.phone)) {
        errors.phone = "Enter a valid 10-digit number";
      }
      return errors;
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
          const res = await api.post("/auth/otp/request", {
            countryCode: values.countryCode.trim(),
            phone: phoneDigits,
          });

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
          if (isAxiosError(error)) {
            if (!error.response) {
              errorMessage =
                error.code === "ERR_NETWORK" ||
                error.message === "Network Error"
                  ? "Cannot reach the API from the browser. On production, set CORS_ORIGINS on the server to include this site (e.g. https://admin.bestbond.in) and redeploy."
                  : errorMessage;
            } else {
              const m = error.response.data?.message as string | string[] | undefined;
              errorMessage = Array.isArray(m) ? m.join(" ") : m ?? errorMessage;
            }
          }
          toast.error(errorMessage);
        }
      } else {
        const pw = adminPassword.trim();
        if (isAdminType === "super" && pw.length < 8) {
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
            body.password = pw;
          }
          const res = await api.post("/auth/admin/otp/login", body);

          if (res.status === 201 || res.status === 200) {
            toast.success("Login Successful");
            localStorage.setItem("accessToken", res?.data?.accessToken);
            localStorage.setItem(
              "userRole",
              JSON.stringify(res?.data?.roles || []),
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
          if (isAxiosError(error)) {
            const m = error.response?.data?.message as string | string[] | undefined;
            const raw =
              typeof m === "string"
                ? m
                : Array.isArray(m)
                  ? m.join(" ")
                  : "";
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
                ? "Enter your OTP and your Super Admin account password (min 8 characters)."
                : "Enter the OTP sent to your mobile number. Ops Admin — password not required."}
          </p>
        </div>

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
              onBlur={formik.handleBlur}
              error={formik.errors.phone}
              touched={formik.touched.phone}
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
                <div className="space-y-2 rounded-2xl border-2 border-brand-orange/25 bg-[#FFF8F3] p-4">
                  <label className="text-[12px] font-semibold text-text-secondary tracking-wider uppercase ml-1">
                    Account password
                  </label>
                  <p className="text-xs text-text-secondary -mt-1 mb-1 leading-relaxed">
                    Same password you use on the mobile app (min 8 characters).
                  </p>
                  <div className="relative">
                    <input
                      name="adminPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Min 8 characters"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-border outline-none focus:ring-2 focus:ring-brand-orange text-sm placeholder:text-text-muted bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                    >
                      {showPassword ? (
                        <BsEyeSlashFill size={18} />
                      ) : (
                        <BsEye size={18} />
                      )}
                    </button>
                  </div>
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

          {step === "request" ? (
            <p className="text-center text-sm text-text-secondary">
              New operational admin?{" "}
              <Link
                to="/register"
                className="text-brand-orange font-bold hover:underline"
              >
                Ops admin registration
              </Link>
            </p>
          ) : null}

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
