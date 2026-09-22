import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ShieldCheck, RefreshCw, Car, Users2, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

function BrandPanel() {
  return (
    <div className="hidden sm:flex sm:w-2/5 relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-[#0a2240] text-white p-8 flex-col justify-between">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-2 font-bold text-lg">
        <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">V</span>
        ShareYourTravel
      </div>
      <div className="relative">
        <h2 className="text-2xl font-bold leading-snug mb-4">Check your inbox.</h2>
        <ul className="space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-3 h-3" />
            </span>
            <span>Enter the 6-digit code we just sent you</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <Car className="w-3 h-3" />
            </span>
            <span>Then set a fresh password</span>
          </li>
        </ul>
      </div>
      <div className="relative text-white/40 text-xs">
        © {new Date().getFullYear()} ShareYourTravel
      </div>
    </div>
  );
}

export default function VerifyResetOtp() {
  const { verifyResetOtp, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();

  const initialEmail = location.state?.email || "";
  const initialDevOtp = location.state?.devOtp || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (!initialEmail) {
      // If someone lands here directly, send them back
      navigate("/forgot-password", { replace: true });
    }
  }, [initialEmail, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    try {
      setLoading(true);
      const result = await verifyResetOtp(email, otp);
      showToast("Code verified");
      navigate("/reset-password", {
        state: {
          email: result.email,
          resetToken: result.resetToken,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const result = await forgotPassword(email);
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

        <div className="flex-1 p-6 sm:p-8">
          <Link to="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Change email
          </Link>

          <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Enter reset code</h1>
          <p className="text-slate-500 text-sm mb-6">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>

          <form onSubmit={submit} className="space-y-4">
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

            <button
              disabled={otp.length !== 6 || loading}
              className="w-full bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Verifying..." : "Verify code"}
            </button>

            <div className="flex items-center justify-between text-sm pt-2">
              <Link to="/login" className="text-slate-500 hover:text-slate-700">
                ← Cancel
              </Link>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-accent font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? "Resend in " + resendCooldown + "s" : "Resend code"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
