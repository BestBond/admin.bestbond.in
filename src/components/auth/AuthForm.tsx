import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import PasscodeInput from "../ui/PasscodeInput";
import { useFormik } from "formik";
import api, { isAxiosError } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { normalizeLocalPhoneDigits } from "../../utils/phone";

const AuthForm = () => {
  const [isAdminType, setIsAdminType] = useState<"super" | "management">(
    "management",
  );
  const [passcode, setPasscode] = useState("");
  const [bootstrapAllowed, setBootstrapAllowed] = useState(false);
  const [opsNoAccountHint, setOpsNoAccountHint] = useState(false);
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
      const phoneDigits = normalizeLocalPhoneDigits(
        values.phone,
        values.countryCode,
      );
      if (phoneDigits.length !== 10 || passcode.length !== 6) {
        toast.error("Enter a valid 10-digit mobile number and 6-digit passcode.");
        return;
      }
      try {
        const res = await api.post("/auth/admin/passcode/login", {
          countryCode: values.countryCode.trim(),
          phone: phoneDigits,
          passcode,
        });

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
        console.error("LOGIN ERROR ", error);
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
            error.response?.status === 403 &&
            /waiting for super admin approval/i.test(raw)
          ) {
            setOpsNoAccountHint(false);
            toast.info(
              "This number is already registered as Ops Admin and is waiting for Super Admin approval. Try again after approval.",
              { autoClose: 7000 },
            );
            return;
          }
          if (
            isAdminType === "management" &&
            error.response?.status === 401 &&
            /management account not found/i.test(raw)
          ) {
            setOpsNoAccountHint(true);
            toast.info(
              "No Ops Admin account for this mobile yet. Register with Ops admin registration — a Super Admin must approve it before you can sign in.",
              { autoClose: 9000 },
            );
            return;
          }
          setOpsNoAccountHint(false);
          errorMessage = Array.isArray(m) ? m.join(" ") : m ?? errorMessage;
        }
        toast.error(errorMessage);
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
            Sign in with your mobile number and 6-digit passcode.
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsAdminType("management");
              setOpsNoAccountHint(false);
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
            onClick={() => {
              setIsAdminType("super");
              setOpsNoAccountHint(false);
            }}
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

          <div className="space-y-4">
            <label
              htmlFor="admin-login-passcode"
              className="text-[12px] font-semibold text-text-secondary tracking-wider uppercase ml-1 block"
            >
              Passcode
            </label>
            <div className="flex justify-center">
              <PasscodeInput
                length={6}
                value={passcode}
                onChange={setPasscode}
                idPrefix="admin-login-passcode"
              />
            </div>
          </div>

          {opsNoAccountHint && isAdminType === "management" ? (
            <div className="rounded-2xl border-2 border-brand-orange/30 bg-[#FFF8F3] p-5 space-y-3">
              <p className="text-sm font-bold text-[#1E2633] leading-relaxed">
                This mobile number does not have an Ops Admin account yet.
                Register with the same number and set a passcode; after a Super
                Admin approves you, return here to sign in.
              </p>
              <Link
                to="/register"
                state={{ prefillPhone: formik.values.phone }}
                className="flex w-full items-center justify-center rounded-full bg-brand-orange py-3.5 text-center text-[15px] font-bold text-white shadow-md transition-opacity hover:opacity-95"
              >
                Create Ops Admin account
              </Link>
            </div>
          ) : null}
        </div>

        <div className="py-4 space-y-4">
          <Button type="submit">Sign in</Button>

          <p className="text-center text-sm text-text-secondary">
            New operational admin?{" "}
            <Link
              to="/register"
              className="text-brand-orange font-bold hover:underline"
            >
              Ops admin registration
            </Link>
          </p>

          {bootstrapAllowed ? (
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
          <Link
            to="/terms-of-service"
            className="text-brand-orange hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy-policy"
            className="text-brand-orange hover:underline"
          >
            Privacy Policy
          </Link>
        </p>
      </form>
    </>
  );
};

export default AuthForm;
