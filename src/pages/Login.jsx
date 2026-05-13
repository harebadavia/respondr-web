import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { apiAuthRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setWarning("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      const backendUser = await apiAuthRequest("/auth/me");
      login({ firebaseUser, backendUser, token });

      if (backendUser.role === "admin") navigate("/admin/dashboard");
      else if (backendUser.role === "official") navigate("/official/dashboard");
      else navigate("/resident/dashboard");
    } catch (err) {
      console.error(err);
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("inactive")) {
        await signOut(auth).catch(() => {});
        setWarning("Your account is inactive. Please wait for administrator approval or contact support.");
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

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
              Secure access
            </p>
            <h1 className="text-2xl font-extrabold text-neutral-900 leading-tight mb-1"
                style={{ fontFamily: "'Syne', sans-serif" }}>
              Sign in to<br/>your account
            </h1>
            <p className="text-sm text-neutral-500 mb-5">
              Submit and track incidents in your area.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-neutral-700 mb-1.5"
                       style={{ fontFamily: "'DM Mono', monospace" }}>
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 border border-neutral-200 bg-neutral-50 rounded-lg px-3.5 text-sm text-neutral-900 placeholder-neutral-300 outline-none focus:border-brand-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-neutral-700 mb-1.5"
                       style={{ fontFamily: "'DM Mono', monospace" }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 border border-neutral-200 bg-neutral-50 rounded-lg px-3.5 text-sm text-neutral-900 placeholder-neutral-300 outline-none focus:border-brand-600 focus:bg-white transition"
                />
                <span className="block text-right text-[11px] text-neutral-400 mt-1 cursor-pointer hover:text-brand-700 transition"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-brand-700 hover:bg-brand-800 active:scale-[0.99] text-white text-sm font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {loading ? "Signing in…" : "Sign in →"}
              </button>

              {error && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded-lg px-4 py-2.5"
                     style={{ fontFamily: "'DM Mono', monospace" }}>
                  {error}
                </div>
              )}

              {warning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg px-4 py-2.5"
                     style={{ fontFamily: "'DM Mono', monospace" }}>
                  {warning}
                </div>
              )}
            </form>

            <hr className="border-neutral-100 my-5" />

            <p className="text-xs text-neutral-400 flex gap-1">
              No account yet?
              <Link to="/register" className="text-brand-700 font-medium hover:underline">
                Create one →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
