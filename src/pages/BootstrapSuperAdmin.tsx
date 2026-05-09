import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../components/ui/InputField";
import Button from "../components/ui/Button";
import OtpInput from "../components/ui/OtpInput";
import { toast, ToastContainer } from "react-toastify";
import { normalizeLocalPhoneDigits } from "../utils/phone";

/**
 * First Super Admin only: GET /auth/superadmin/bootstrap-available must be true.
 */
export default function BootstrapSuperAdmin() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [countryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/auth/superadmin/bootstrap-available`)
      .then((r) => setAllowed(r.data?.allowed === true))
      .catch(() => setAllowed(false));
  }, []);

  const requestOtp = async () => {
    const digits = normalizeLocalPhoneDigits(phone, countryCode);
    if (digits.length !== 10) {
      toast.error(
        "Enter your 10-digit mobile (without +91 — it is already the default).",
      );
      return;
    }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/otp/request`,
        { countryCode, phone: digits },
        { headers: { "Content-Type": "application/json" } },
      );
      if (res.status === 201 || res.status === 200) {
        toast.success("OTP sent.");
        if (res.data?.devCode) setOtp(String(res.data.devCode));
        setStep("verify");
      }
    } catch (e) {
      console.error(e);
      let msg = "Failed to send OTP";
      if (axios.isAxiosError(e)) {
        const m = e.response?.data?.message;
        msg = Array.isArray(m) ? m.join(" ") : m ?? msg;
      }
      toast.error(msg);
    }
  };

  const submitSignup = async () => {
    const digits = normalizeLocalPhoneDigits(phone, countryCode);
    if (digits.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Enter full name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Enter email.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/superadmin/otp/signup`,
        {
          countryCode,
          phone: digits,
          code: otp,
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        },
        { headers: { "Content-Type": "application/json" } },
      );
      const token = res.data?.accessToken;
      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem(
          "userRole",
          JSON.stringify(res.data?.roles || []),
        );
        localStorage.setItem(
          "userPermissions",
          JSON.stringify(res.data?.permissions ?? []),
        );
        toast.success("Super Admin created.");
        navigate("/dashboard");
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (e) {
      console.error(e);
      let msg = "Could not create Super Admin";
      if (axios.isAxiosError(e)) {
        const m = e.response?.data?.message;
        msg = Array.isArray(m) ? m.join(" ") : m ?? e.message;
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-offwhite text-text-primary">
        Checking setup…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-offwhite px-6 text-center">
        <p className="text-text-primary font-medium text-lg mb-4">
          A Super Admin account already exists. Use the normal login page.
        </p>
        <Link
          to="/login"
          className="text-brand-orange font-bold text-lg hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen flex items-center justify-center bg-bg-offwhite py-12 px-4">
        <div className="w-full max-w-lg space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-bricolage text-text-primary">
              First Super Admin setup
            </h1>
            <p className="text-text-secondary mt-2 text-sm">
              Verify your mobile with OTP, then set your profile and account
              password (min 8 characters). You will use this password together
              with OTP on every Super Admin login.
            </p>
          </div>

          {step === "request" ? (
            <>
              <InputField
                label="Mobile (10 digits)"
                placeholder="Mobile"
                type="tel"
                name="phone"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    normalizeLocalPhoneDigits(e.target.value, countryCode),
                  )
                }
              />
              <Button type="button" onClick={requestOtp}>
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-text-secondary tracking-wider uppercase ml-1">
                  Verification code
                </label>
                <div className="flex justify-center">
                  <OtpInput length={6} value={otp} onChange={setOtp} />
                </div>
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="text-sm text-brand-orange font-bold"
                >
                  Change mobile
                </button>
              </div>
              <InputField
                label="Full name"
                placeholder="Full name"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <InputField
                label="Email"
                placeholder="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <InputField
                label="Account password (min 8)"
                placeholder="Password"
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <InputField
                label="Confirm password"
                placeholder="Confirm password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="button"
                onClick={submitSignup}
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create Super Admin"}
              </Button>
            </>
          )}

          <p className="text-center">
            <Link to="/login" className="text-brand-orange font-bold text-sm">
              Already have access? Log in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
