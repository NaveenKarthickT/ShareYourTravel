import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, ShieldCheck, RefreshCw, Car, Users2, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import { useToast } from "../components/Toast.jsx";

const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const validatePassword = (v) => v.length >= 6;

// Shared left panel — brand + value props
function BrandPanel() {
  return (
    <div className="hidden sm:flex sm:w-2/5 relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-[#0a2240] text-white p-8 flex-col justify-between">
      {/* Floating ambient blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* Floating car icon */}
      <div className="absolute top-1/3 right-6 opacity-10 pointer-events-none">
        <Car className="w-32 h-32" />
      </div>

      <div className="relative flex items-center gap-2 font-bold text-lg">
        <Logo size={36} />
        ShareYourTravel
      </div>

      <div className="relative">
        <h2 className="text-2xl font-bold leading-snug mb-4">
          Ride with people you actually know.
        </h2>
        <ul className="space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <Car className="w-3 h-3" />
            </span>
            <span>Every community runs its own pooling server</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <Users2 className="w-3 h-3" />
            </span>
            <span>Admin-approved, private membership</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <MapPinned className="w-3 h-3" />
            </span>
            <span>Route-based trip search &amp; requests</span>
          </li>
        </ul>
      </div>

      <div className="relative text-white/40 text-xs">
        © {new Date().getFullYear()} ShareYourTravel
      </div>
    </div>
  );
}

export default function Login() {
  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const canSubmitCreds = validateEmail(form.email) && validatePassword(form.password) && !loading;

  const submitCredentials = async (e) => {
    e.preventDefault();
    setError("");
    if (!canSubmitCreds) return;
    try {
      setLoading(true);
      const result = await login(form.email, form.password);
      setEmailForOtp(result.email);
      if (result.devOtp) setDevOtp(result.devOtp);
      setStep(2);
      setResendCooldown(30);
      showToast("Verification code sent");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit code"); return; }
    try {
      setLoading(true);
      await verifyOtp(emailForOtp, otp);
      showToast("Verified — welcome back!");
      navigate("/organizations");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const result = await resendOtp(emailForOtp, "login");
      if (result.devOtp) setDevOtp(result.devOtp);
      setResendCooldown(30);
      showToast("New code sent");
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend code");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col sm:flex-row">
        <BrandPanel />

        {/* Right side — switches between credentials & OTP */}
        <div className="flex-1 p-6 sm:p-8">
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Welcome back</h1>
              <p className="text-slate-500 text-sm mb-6">Sign in to continue to your dashboard.</p>

              <form onSubmit={submitCredentials} className="space-y-4" noValidate>
                {error && (
                  <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                    <span>⚠</span> {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="••••••••" />
                  </div>
                </div>

                <button disabled={!canSubmitCreds}
                  className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed transition">
                  <LogIn className="w-4 h-4" />
                  {loading ? "Verifying..." : "Continue"}
                </button>

                <p className="text-sm text-center text-slate-500">
                  New here?{" "}
                  <Link to="/register" className="text-accent font-medium hover:underline">
                    Create an account
                  </Link>
                </p>

                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                  <p className="font-semibold text-slate-500 mb-2">Demo accounts:</p>
                  <p><code>super@velocity.com</code> / <code>super123</code> — Super Admin</p>
                  <p><code>admin@greenride.com</code> / <code>admin123</code> — Org Admin</p>
                  <p><code>user@greenride.com</code> / <code>user123</code> — Regular User</p>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-lg bg-accent-soft dark:bg-slate-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-primary dark:text-sky-300">Verify your identity</h1>
                  <p className="text-slate-500 text-xs">One more step to sign in</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                We sent a 6-digit code to <strong className="text-slate-800 dark:text-slate-200">{emailForOtp}</strong>.
                Enter it below to finish signing in.
              </p>

              <form onSubmit={submitOtp} className="space-y-4">
                {error && (
                  <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                    <span>⚠</span> {error}
                  </div>
                )}

                {devOtp && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-md">
                    🧪 <strong>Dev mode:</strong> your code is{" "}
                    <code className="font-mono font-bold">{devOtp}</code>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                <button disabled={otp.length !== 6 || loading}
                  className="w-full bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed transition">
                  {loading ? "Verifying..." : "Verify and sign in"}
                </button>

                <div className="flex items-center justify-between text-sm pt-2">
                  <button type="button"
                    onClick={() => { setStep(1); setOtp(""); setError(""); setDevOtp(""); }}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    ← Back
                  </button>
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                    className="text-accent font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    {resendCooldown > 0 ? "Resend in " + resendCooldown + "s" : "Resend code"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
