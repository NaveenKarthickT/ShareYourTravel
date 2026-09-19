import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, UserPlus, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      setLoading(true);
      await register(form);
      navigate("/organizations");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <span className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center text-xl font-bold mb-3">V</span>
          <h1 className="text-2xl font-bold text-primary">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join Velocity Pool in seconds.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="+91 90000 00000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="At least 6 characters" />
            </div>
          </div>

          <button disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60">
            <UserPlus className="w-4 h-4" />
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="text-sm text-center text-slate-500">
            Already have an account? <Link to="/login" className="text-accent font-medium">Login</Link>
          </p>
          <p className="text-xs text-center text-slate-400 pt-2 border-t border-slate-100 mt-4">
            After registering, you'll choose an existing community to join — or create a new one
            and become its admin.
          </p>
        </form>
      </div>
    </div>
  );
}
