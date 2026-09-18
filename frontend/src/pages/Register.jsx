import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const FIELD_ICONS = { name: User, email: Mail, phone: Phone };

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6 text-center">Create your account</h1>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">{error}</div>}
        {["name", "email", "phone"].map((field) => {
          const Icon = FIELD_ICONS[field];
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">{field}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          );
        })}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <button
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white rounded-md py-2.5 font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          <UserPlus className="w-4 h-4" />
          {loading ? "Creating account..." : "Register"}
        </button>
        <p className="text-sm text-center text-slate-500">
          Already have an account? <Link to="/login" className="text-brand-600 font-medium">Login</Link>
        </p>
      </form>
    </div>
  );
}
