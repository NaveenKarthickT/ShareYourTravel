import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Car, Users2, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const validatePassword = (v) => v.length >= 6;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col sm:flex-row">
        <div className="hidden sm:flex sm:w-2/5 bg-gradient-to-br from-primary to-primary-light text-white p-8 flex-col justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">V</span>
            Velocity Pool
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-snug mb-3">Ride with people you actually know.</h2>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li className="flex items-center gap-2"><Car className="w-4 h-4 shrink-0" /> Every community runs its own pooling server</li>
              <li className="flex items-center gap-2"><Users2 className="w-4 h-4 shrink-0" /> Admin-approved, private membership</li>
              <li className="flex items-center gap-2"><MapPinned className="w-4 h-4 shrink-0" /> Route-based trip search & requests</li>
            </ul>
          </div>
          <div className="text-white/40 text-xs">© {new Date().getFullYear()} Velocity Pool</div>
        </div>

        <div className="flex-1 p-6 sm:p-8">
          <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-6">Sign in to continue to your dashboard.</p>
          <form onSubmit={submit} className="space-y-4" noValidate>
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
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  className={`w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition ${emailError ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-accent"}`}
                  placeholder="you@example.com" />
              </div>
              {emailError && <p className="text-xs text-rose-600 mt-1">Please enter a valid email address.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  className={`w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition ${passwordError ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-accent"}`}
                  placeholder="••••••••" />
              </div>
              {passwordError && <p className="text-xs text-rose-600 mt-1">Password must be at least 6 characters.</p>}
            </div>
            <button disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed transition">
              <LogIn className="w-4 h-4" />
              {loading ? "Logging in..." : "Login"}
            </button>
            <p className="text-sm text-center text-slate-500">
              New here? <Link to="/register" className="text-accent font-medium hover:underline">Create an account</Link>
            </p>
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              <p className="font-semibold text-slate-500 mb-2">Demo accounts:</p>
              <p><code>super@velocity.com</code> / <code>super123</code> — Super Admin</p>
              <p><code>admin@greenride.com</code> / <code>admin123</code> — Org Admin</p>
              <p><code>user@greenride.com</code> / <code>user123</code> — Regular User</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
