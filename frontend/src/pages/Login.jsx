import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Car, Users2, MapPinned, Sparkles, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const validatePassword = (v) => v.length >= 6;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailError = touched.email && form.email && !validateEmail(form.email);
  const passwordError = touched.password && form.password && !validatePassword(form.password);
  const canSubmit = validateEmail(form.email) && validatePassword(form.password) && !loading;

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError("");
    if (!canSubmit) return;
    try {
      setLoading(true);
      await login(form.email, form.password);
      navigate("/organizations");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col sm:flex-row">
        {/* Left Branding Panel */}
        <div className="hidden sm:flex sm:w-2/5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 dark:from-slate-950 dark:to-slate-900 text-white p-8 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2.5 font-bold text-lg relative z-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00A3C4] to-[#38BDF8] flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            Velocity Pool
          </div>
          <div className="relative z-10 my-8">
            <h2 className="text-2xl font-extrabold leading-snug mb-3 text-white">
              Ride with people you actually know.
            </h2>
            <p className="text-slate-300 text-xs mb-6 leading-relaxed">
              Join trusted peer-to-peer carpools within your company, college, or housing community.
            </p>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                </span>
                Private community pooling
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Users2 className="w-3.5 h-3.5 text-cyan-400" />
                </span>
                Verified member access
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <MapPinned className="w-3.5 h-3.5 text-cyan-400" />
                </span>
                Smart route-based matching
              </li>
            </ul>
          </div>
          <div className="text-white/40 text-[11px] relative z-10">
            © {new Date().getFullYear()} Velocity Pool
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-6 sm:p-10">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  className={`w-full bg-slate-50 dark:bg-slate-800/80 border rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 transition-all ${
                    emailError
                      ? "border-rose-400 focus:ring-rose-200 dark:border-rose-500/60"
                      : "border-slate-200 dark:border-slate-700 focus:border-[#00A3C4] focus:ring-[#00A3C4]/20"
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {emailError && (
                <p className="text-xs text-rose-500 font-medium mt-1">Please enter a valid email address.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  className={`w-full bg-slate-50 dark:bg-slate-800/80 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 transition-all ${
                    passwordError
                      ? "border-rose-400 focus:ring-rose-200 dark:border-rose-500/60"
                      : "border-slate-200 dark:border-slate-700 focus:border-[#00A3C4] focus:ring-[#00A3C4]/20"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-rose-500 font-medium mt-1">Password must be at least 6 characters.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white rounded-xl py-3 font-bold text-sm shadow-md shadow-[#00A3C4]/25 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in..." : "Sign in to Dashboard"}
            </button>

            <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              Don't have an account yet?{" "}
              <Link to="/register" className="text-[#00A3C4] dark:text-cyan-400 font-bold hover:underline">
                Create one
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}