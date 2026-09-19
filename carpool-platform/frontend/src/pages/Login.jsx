import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Car, Users2, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      setLoading(true);
      await login(form.email, form.password);
      navigate("/organizations");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row">
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
          <h1 className="text-2xl font-bold mb-1 text-primary">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-6">Sign in to continue to your dashboard.</p>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="••••••••" />
              </div>
            </div>
            <button disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60">
              <LogIn className="w-4 h-4" />
              {loading ? "Logging in..." : "Login"}
            </button>
            <p className="text-sm text-center text-slate-500">
              New here? <Link to="/register" className="text-accent font-medium">Create an account</Link>
            </p>

            <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-400">
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
