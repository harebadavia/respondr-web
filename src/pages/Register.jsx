import { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { apiRequest } from "../services/api";

const initialForm = {
  first_name: "",
  last_name: "",
  phone_number: "",
  email: "",
  password: "",
  confirm_password: "",
};

function normalizePhilippineMobileNumber(value) {
  const digitsOnly = String(value || "").replace(/\D/g, "");
  if (/^09\d{9}$/.test(digitsOnly)) return `+63${digitsOnly.slice(1)}`;
  return null;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function validateForm(form) {
  const errors = {};

  if (!form.first_name.trim()) errors.first_name = "First name is required.";
  if (!form.last_name.trim()) errors.last_name = "Last name is required.";

  if (!validateEmail(form.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!/^09\d{9}$/.test(String(form.phone_number || "").trim())) {
    errors.phone_number = "Please enter a valid 11-digit contact number.";
  }

  if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (form.confirm_password !== form.password) {
    errors.confirm_password = "Passwords do not match.";
  }

  return errors;
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-xs text-[#991B1B]" style={{ fontFamily: "'DM Mono', monospace" }}>
      {children}
    </p>
  );
}

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };

    setForm(nextForm);
    setSuccess("");

    if (fieldErrors[name]) {
      setFieldErrors(validateForm(nextForm));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const nextErrors = validateForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    try {
      const normalizedPhoneNumber = normalizePhilippineMobileNumber(form.phone_number);
      const userCredential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const firebaseUser = userCredential.user;

      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone_number: normalizedPhoneNumber,
        }),
      });

      await signOut(auth).catch(() => {});
      setForm(initialForm);
      setFieldErrors({});
      setSuccess("Registration successful. You may now log in.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    [
      "w-full h-11 border bg-neutral-50 rounded-lg px-3.5 text-sm text-neutral-900 placeholder-neutral-300 outline-none focus:bg-white transition",
      fieldErrors[name] ? "border-[#FCA5A5] focus:border-[#DC2626]" : "border-neutral-200 focus:border-brand-600",
    ].join(" ");

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen w-full overflow-hidden lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">

        {/* Hero */}
        <div className="relative isolate flex min-h-[360px] flex-col justify-between overflow-hidden bg-[#101216] px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-12 xl:px-16">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(15,126,184,0.24)_0%,rgba(16,18,22,0)_38%),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:auto,56px_56px,56px_56px]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-brand-900/30 to-transparent" />

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 shadow-lg shadow-brand-900/30">
              <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-widest text-white"
                 style={{ fontFamily: "'Syne', sans-serif" }}>
                RESPONDR
              </p>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45"
                 style={{ fontFamily: "'DM Mono', monospace" }}>
                Incident response
              </p>
            </div>
          </div>

          <div className="my-12 max-w-xl lg:my-0">
            <p className="mb-4 text-[11px] uppercase tracking-[0.32em] text-brand-200"
               style={{ fontFamily: "'DM Mono', monospace" }}>
              Community safety desk
            </p>
            <h1 className="max-w-[11ch] text-4xl font-extrabold leading-[0.98] text-white sm:text-5xl lg:text-6xl xl:text-7xl"
                style={{ fontFamily: "'Syne', sans-serif" }}>
              Report. Route. Resolve.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-6 text-white/62 sm:text-base">
              A focused workspace for incidents, alerts, maps, and response coordination.
            </p>
          </div>

          <div className="grid max-w-xl grid-cols-[1fr_auto] gap-3 border-t border-white/10 pt-5">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/36"
                 style={{ fontFamily: "'DM Mono', monospace" }}>
                Location-aware
              </p>
              <p className="mt-1 text-sm text-white/70">
                Built around reports that need context, urgency, and clear handoffs.
              </p>
            </div>
            <div className="hidden h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] sm:flex">
              <div className="h-2.5 w-2.5 rounded-full bg-brand-500 shadow-[0_0_0_8px_rgba(15,126,184,0.16)]" />
            </div>
          </div>
        </div>

        {/* Main form */}
        <div className="flex min-h-[calc(100vh-360px)] flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:min-h-screen lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <p className="text-[10px] text-brand-700 uppercase tracking-widest mb-2"
               style={{ fontFamily: "'DM Mono', monospace" }}>
              Resident access
            </p>
            <h1 className="text-2xl font-extrabold text-neutral-900 leading-tight mb-1"
                style={{ fontFamily: "'Syne', sans-serif" }}>
              Create your<br/>account
            </h1>
            <p className="text-sm text-neutral-500 mb-5">
              Register to submit and track incidents in your area.
            </p>

            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-neutral-700 mb-1.5"
                         style={{ fontFamily: "'DM Mono', monospace" }}>
                    First name
                  </label>
                  <input
                    name="first_name"
                    required
                    value={form.first_name}
                    onChange={onChange}
                    placeholder="Juan"
                    className={inputClass("first_name")}
                  />
                  <FieldError>{fieldErrors.first_name}</FieldError>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-neutral-700 mb-1.5"
                         style={{ fontFamily: "'DM Mono', monospace" }}>
                    Last name
                  </label>
                  <input
                    name="last_name"
                    required
                    value={form.last_name}
                    onChange={onChange}
                    placeholder="Dela Cruz"
                    className={inputClass("last_name")}
                  />
                  <FieldError>{fieldErrors.last_name}</FieldError>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-neutral-700 mb-1.5"
                       style={{ fontFamily: "'DM Mono', monospace" }}>
                  Contact number
                </label>
                <input
                  name="phone_number"
                  required
                  inputMode="numeric"
                  value={form.phone_number}
                  onChange={onChange}
                  placeholder="09XXXXXXXXX"
                  className={inputClass("phone_number")}
                />
                <FieldError>{fieldErrors.phone_number}</FieldError>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-neutral-700 mb-1.5"
                       style={{ fontFamily: "'DM Mono', monospace" }}>
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={onChange}
                  placeholder="you@example.com"
                  className={inputClass("email")}
                />
                <FieldError>{fieldErrors.email}</FieldError>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-neutral-700 mb-1.5"
                         style={{ fontFamily: "'DM Mono', monospace" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={onChange}
                    placeholder="Min 6 characters"
                    className={inputClass("password")}
                  />
                  <FieldError>{fieldErrors.password}</FieldError>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-neutral-700 mb-1.5"
                         style={{ fontFamily: "'DM Mono', monospace" }}>
                    Confirm password
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    required
                    value={form.confirm_password}
                    onChange={onChange}
                    placeholder="Repeat password"
                    className={inputClass("confirm_password")}
                  />
                  <FieldError>{fieldErrors.confirm_password}</FieldError>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-brand-700 hover:bg-brand-800 active:scale-[0.99] text-white text-sm font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {submitting ? "Creating account..." : "Create account →"}
              </button>

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg px-4 py-2.5"
                     style={{ fontFamily: "'DM Mono', monospace" }}>
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded-lg px-4 py-2.5"
                     style={{ fontFamily: "'DM Mono', monospace" }}>
                  {error}
                </div>
              )}
            </form>

            <hr className="border-neutral-100 my-5" />

            <p className="text-xs text-neutral-400 flex gap-1">
              Already have an account?
              <Link to="/" className="text-brand-700 font-medium hover:underline">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
