import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, UserPlus, Sparkles, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const validateName = (v) => v.trim().length >= 2;
const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const validatePassword = (v) => v.length >= 6;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const errors = {
    name: touched.name && !validateName(form.name),
    email: touched.email && form.email && !validateEmail(form.email),
    password: touched.password && form.password && !validatePassword(form.password),
  };

  const canSubmit =
    validateName(form.name) &&
    validateEmail(form.email) &&
    validatePassword(form.password) &&
    !loading;

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    className: `w-full bg-slate-50 dark:bg-slate-800/80 border rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 transition-all ${
      errors[key]
        ? "border-rose-400 focus:ring-rose-200 dark:border-rose-500/60"
        : "border-slate-200 dark:border-slate-700 focus:border-[#00A3C4] focus:ring-[#00A3C4]/20"
    }`,
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A3C4] to-[#38BDF8] text-white flex items-center justify-center shadow-lg shadow-[#00A3C4]/30 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create an Account
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Join Velocity Pool and start sharing rides today.
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
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input {...field("name")} placeholder="Jane Doe" />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-500 font-medium mt-1">Name must be at least 2 characters.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="email" {...field("email")} placeholder="you@example.com" />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 font-medium mt-1">Please enter a valid email.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input {...field("phone")} placeholder="+91 98765 43210" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                {...field("password")}
                placeholder="At least 6 characters"
                className={`${field("password").className} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 font-medium mt-1">Password must be at least 6 characters.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white rounded-xl py-3 font-bold text-sm shadow-md shadow-[#00A3C4]/25 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-[#00A3C4] dark:text-cyan-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}