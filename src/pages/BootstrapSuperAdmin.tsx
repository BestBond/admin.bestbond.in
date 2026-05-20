import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../components/ui/InputField";
import Button from "../components/ui/Button";
import PasscodeInput from "../components/ui/PasscodeInput";
import { toast, ToastContainer } from "react-toastify";
import { normalizeLocalPhoneDigits } from "../utils/phone";
import api, { isAxiosError } from "../utils/api";

/**
 * First Super Admin only: GET /auth/superadmin/bootstrap-available must be true.
 */
export default function BootstrapSuperAdmin() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [countryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/auth/superadmin/bootstrap-available")
      .then((r) => setAllowed(r.data?.allowed === true))
      .catch(() => setAllowed(false));
  }, []);

  const submitSignup = async () => {
    const digits = normalizeLocalPhoneDigits(phone, countryCode);
    if (digits.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    if (passcode.length !== 6 || confirmPasscode.length !== 6) {
      toast.error("Enter a valid 6-digit passcode.");
      return;
    }
    if (passcode !== confirmPasscode) {
      toast.error("Passcodes do not match.");
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
    setSubmitting(true);
    try {
      const res = await api.post("/auth/superadmin/passcode/signup", {
        countryCode,
        phone: digits,
        passcode,
        confirmPasscode,
        fullName: fullName.trim(),
        email: email.trim(),
      });
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
      if (isAxiosError(e)) {
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
              Set your mobile, profile, and a 6-digit passcode. You will use this
              passcode on every Super Admin login.
            </p>
          </div>

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
              setPhone(normalizeLocalPhoneDigits(e.target.value, countryCode))
            }
          />
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

          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-text-secondary tracking-wider uppercase ml-1">
              Passcode
            </label>
            <div className="flex justify-center">
              <PasscodeInput
                length={6}
                value={passcode}
                onChange={setPasscode}
                idPrefix="super-bootstrap-passcode"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-text-secondary tracking-wider uppercase ml-1">
              Confirm passcode
            </label>
            <div className="flex justify-center">
              <PasscodeInput
                length={6}
                value={confirmPasscode}
                onChange={setConfirmPasscode}
                idPrefix="super-bootstrap-confirm"
              />
            </div>
          </div>

          <Button type="button" onClick={submitSignup} disabled={submitting}>
            {submitting ? "Creating…" : "Create Super Admin"}
          </Button>

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
