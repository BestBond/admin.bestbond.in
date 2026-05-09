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

const AuthForm = () => {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [isAdminType, setIsAdminType] = useState<"super" | "management">("super");
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
        const phoneDigits = String(values.phone).replace(/\D/g, "").slice(0, 10);
        if (phoneDigits.length !== 10) {
          toast.error("Enter a valid 10-digit mobile number.");
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
            const m = error.response?.data?.message;
            errorMessage = Array.isArray(m) ? m.join(" ") : m ?? errorMessage;
          }
          toast.error(errorMessage);
        }
      } else {
        if (isAdminType === "super" && adminPassword.trim().length < 8) {
          toast.error("Enter your account password (min 8 characters).");
          return;
        }
        try {
          const phoneDigits = String(values.phone).replace(/\D/g, "").slice(0, 10);
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
                ? "Enter the OTP and your account password."
                : "Enter the OTP sent to your mobile number (Ops Admin — password not required)."}
          </p>
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
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
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
                <InputField
                  label="Account password"
                  placeholder="Min 8 characters"
                  type="password"
                  name="adminPassword"
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
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

          {step === "request" && (
            <button
              type="button"
              onClick={() =>
                setIsAdminType(isAdminType === "super" ? "management" : "super")
              }
              className="w-full py-4 rounded-full border-2 border-brand-orange text-brand-orange font-bold text-lg transition-all hover:bg-brand-orange/5"
            >
              {isAdminType === "super"
                ? "Management Login"
                : "Super Admin Login"}
            </button>
          )}

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
