import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, ShieldCheck, ArrowLeft, Car, Users2, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

const validatePassword = (v) => v.length >= 6;

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
        <h2 className="text-2xl font-bold leading-snug mb-4">Almost done.</h2>
        <ul className="space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-3 h-3" />
            </span>
            <span>Set a strong password you'll remember</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-3 h-3" />
            </span>
            <span>You'll be signed out everywhere else</span>
          </li>
        </ul>
      </div>
      <div className="relative text-white/40 text-xs">
        © {new Date().getFullYear()} ShareYourTravel
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();

  const email = location.state?.email || "";
  const resetToken = location.state?.resetToken || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, resetToken, navigate]);

  const passwordError = touched.password && password && !validatePassword(password);
  const confirmError = touched.confirm && confirm && confirm !== password;
  const canSubmit =
    validatePassword(password) &&
    password === confirm &&
    !loading;

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (!canSubmit) return;
    try {
      setLoading(true);
      await resetPassword(email, resetToken, password);
      showToast("Password updated. Please log in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col sm:flex-row">
        <BrandPanel />

        <div className="flex-1 p-6 sm:p-8">
          <Link to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>

          <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Set a new password</h1>
          <p className="text-slate-500 text-sm mb-6">
            For <strong>{email}</strong> — choose something at least 6 characters long.
          </p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {error && (
              <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  className={
                    "w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition " +
                    (passwordError
                      ? "border-rose-400 focus:ring-rose-200"
                      : "border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-accent")
                  }
                  placeholder="At least 6 characters"
                  autoFocus
                />
              </div>
              {passwordError && (
                <p className="text-xs text-rose-600 mt-1">
                  Password must be at least 6 characters.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                  className={
                    "w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition " +
                    (confirmError
                      ? "border-rose-400 focus:ring-rose-200"
                      : "border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-accent")
                  }
                  placeholder="Re-enter your password"
                />
              </div>
              {confirmError && (
                <p className="text-xs text-rose-600 mt-1">Passwords don't match.</p>
              )}
            </div>

            <button
              disabled={!canSubmit}
              className="w-full bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Updating..." : "Update password"}
            </button>

            <p className="text-xs text-slate-400 text-center">
              <Link to="/login" className="text-accent font-medium hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
