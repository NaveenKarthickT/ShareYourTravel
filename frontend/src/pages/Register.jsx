import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, UserPlus, ShieldCheck, RefreshCw, Car, Users2, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const validatePassword = (v) => v.length >= 6;
const validateName = (v) => v.trim().length >= 2;

function BrandPanel() {
  return (
    <div className="hidden sm:flex sm:w-2/5 bg-gradient-to-br from-primary to-primary-light text-white p-8 flex-col justify-between">
      <div className="flex items-center gap-2 font-bold text-lg">
        <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">V</span>
        ShareYourVehicle
      </div>
      <div>
        <h2 className="text-2xl font-bold leading-snug mb-4">
          Join a private pooling community.
        </h2>
        <ul className="space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-2.5">
            <Car className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Verified members only</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Users2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Admin-approved access</span>
          </li>
          <li className="flex items-start gap-2.5">
            <MapPinned className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Post &amp; find rides instantly</span>
          </li>
        </ul>
      </div>
      <div className="text-white/40 text-xs">
        © {new Date().getFullYear()} ShareYourVehicle
      </div>
    </div>
  );
}

export default function Register() {
  const { register, verifySignup, resendOtp } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [touched, setTouched] = useState({});
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

  const errors = {
    name: touched.name && form.name && !validateName(form.name),
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
    className:
      "w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition " +
      (errors[key]
        ? "border-rose-400 focus:ring-rose-200"
        : "border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-accent"),
  });

  const submitForm = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    setError("");
    if (!canSubmit) return;
    try {
      setLoading(true);
      const result = await register(form);
      setEmailForOtp(result.email);
      if (result.devOtp) setDevOtp(result.devOtp);
      setStep(2);
      setResendCooldown(30);
      showToast("Verification code sent");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account.");
    } finally { setLoading(false); }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit code"); return; }
    try {
      setLoading(true);
      await verifySignup(emailForOtp, otp);
      showToast("Account verified — welcome!");
      navigate("/organizations");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const result = await resendOtp(emailForOtp, "signup");
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
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Create your account</h1>
              <p className="text-slate-500 text-sm mb-6">Join ShareYourVehicle in seconds.</p>

              <form onSubmit={submitForm} className="space-y-4" noValidate>
                {error && (
                  <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                    <span>⚠</span> {error}
                  </div>
                )}

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
                  {loading ? "Creating account..." : "Continue"}
                </button>

                <p className="text-sm text-center text-slate-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-accent font-medium hover:underline">Login</Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-lg bg-accent-soft dark:bg-slate-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-primary dark:text-sky-300">Verify your email</h1>
                  <p className="text-slate-500 text-xs">One more step to finish</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                We sent a 6-digit code to <strong className="text-slate-800 dark:text-slate-200">{emailForOtp}</strong>.
                Enter it below to activate your account.
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
                  {loading ? "Verifying..." : "Verify and create account"}
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
