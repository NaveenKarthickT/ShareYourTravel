import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const validatePassword = (v) => v.length >= 6;
const validateName = (v) => v.trim().length >= 2;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const errors = {
    name: touched.name && form.name && !validateName(form.name),
    email: touched.email && form.email && !validateEmail(form.email),
    password: touched.password && form.password && !validatePassword(form.password),
  };

  const canSubmit = validateName(form.name) && validateEmail(form.email) && validatePassword(form.password) && !loading;

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    className: `w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition ${errors[key] ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-accent"}`,
  });

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    setError("");
    if (!canSubmit) return;
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
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <span className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center text-xl font-bold mb-3">V</span>
          <h1 className="text-2xl font-bold text-primary dark:text-sky-300">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join Velocity Pool in seconds.</p>
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...field("name")} placeholder="John Doe" />
            </div>
            {errors.name && <p className="text-xs text-rose-600 mt-1">Name must be at least 2 characters.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" {...field("email")} placeholder="you@example.com" />
            </div>
            {errors.email && <p className="text-xs text-rose-600 mt-1">Please enter a valid email.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...field("phone")} placeholder="+91 90000 00000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" {...field("password")} placeholder="At least 6 characters" />
            </div>
            {errors.password && <p className="text-xs text-rose-600 mt-1">Password must be at least 6 characters.</p>}
          </div>

          <button disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed transition">
            <UserPlus className="w-4 h-4" />
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="text-sm text-center text-slate-500">
            Already have an account? <Link to="/login" className="text-accent font-medium hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
