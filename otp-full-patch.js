// ============================================================
// OTP Full Patch · Login + Registration OTP verification
// Run: node otp-full-patch.js   (from carpool-platform3 root)
// ============================================================

const fs = require('fs');
const path = require('path');

const backendDir = path.resolve('backend');
const frontendDir = path.resolve('frontend');

if (!fs.existsSync(backendDir) || !fs.existsSync(frontendDir)) {
  console.error('❌ Run this from inside carpool-platform3');
  process.exit(1);
}

const write = (p, content) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/^\n/, ''), 'utf8');
  console.log('  ✏️  Wrote: ' + path.relative(process.cwd(), p));
};

const patch = (filePath, replacements) => {
  if (!fs.existsSync(filePath)) {
    console.log('  ⚠️  Missing: ' + path.relative(process.cwd(), filePath));
    return false;
  }
  let src = fs.readFileSync(filePath, 'utf8');
  let changed = 0;
  for (const [find, replace] of replacements) {
    if (!src.includes(find)) {
      console.log('  ⚠️  Pattern not found in ' + path.basename(filePath));
      continue;
    }
    src = src.replace(find, replace);
    changed++;
  }
  if (changed) {
    fs.writeFileSync(filePath, src, 'utf8');
    console.log('  🔧 Patched: ' + path.relative(process.cwd(), filePath) + ` (${changed})`);
  }
  return changed > 0;
};

console.log('\n🔐 Applying FULL OTP patch (login + registration)...\n');

// ============================================================
// 1. NEW: backend/src/utils/sendOtp.js (if not exists)
// ============================================================
if (!fs.existsSync(path.join(backendDir, 'src/utils/sendOtp.js'))) {
  write(path.join(backendDir, 'src/utils/sendOtp.js'), `
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (to, otp, name = "there") => {
  const mailOptions = {
    from: '"Velocity Pool" <' + process.env.SMTP_USER + '>',
    to,
    subject: "Your Velocity Pool verification code",
    html: \`
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F8FAFC; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #00A3C4; border-radius: 12px; line-height: 48px; color: #fff; font-weight: bold; font-size: 22px;">V</div>
        </div>
        <h1 style="color: #0B2B4F; font-size: 22px; margin: 0 0 8px; text-align: center;">Verify your account</h1>
        <p style="color: #475569; font-size: 14px; text-align: center; margin: 0 0 24px;">
          Hi \${name}, use the code below to complete verification.
        </p>
        <div style="background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0B2B4F; font-family: monospace;">
            \${otp}
          </div>
        </div>
        <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
          This code expires in <strong>10 minutes</strong>.
        </p>
      </div>
    \`,
  };
  await transporter.sendMail(mailOptions);
};

export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
`);
} else {
  console.log('  ✓ backend/src/utils/sendOtp.js already exists');
}

// ============================================================
// 2. NEW: backend/src/models/Otp.js (if not exists)
// ============================================================
if (!fs.existsSync(path.join(backendDir, 'src/models/Otp.js'))) {
  write(path.join(backendDir, 'src/models/Otp.js'), `
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["login", "signup"], default: "login" },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Otp", otpSchema);
`);
} else {
  console.log('  ✓ backend/src/models/Otp.js already exists');
}

// ============================================================
// 3. REPLACE: backend/src/controllers/authController.js
// ============================================================
write(path.join(backendDir, 'src/controllers/authController.js'), `
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Feedback from "../models/Feedback.js";
import Otp from "../models/Otp.js";
import { sendOtpEmail, generateOtp } from "../utils/sendOtp.js";
import { generateToken } from "../utils/generateToken.js";

const ratingSummary = async (userId) => {
  const feedback = await Feedback.find({ aboutUser: userId });
  if (!feedback.length) return { avgRating: null, ratingCount: 0 };
  const avg = feedback.reduce((s, f) => s + f.rating, 0) / feedback.length;
  return { avgRating: Number(avg.toFixed(1)), ratingCount: feedback.length };
};

const publicUser = async (user) => {
  const rating = await ratingSummary(user._id);
  return {
    id: user._id, name: user.name, email: user.email, phone: user.phone,
    avatar: user.avatar, platformRole: user.platformRole,
    avgRating: rating.avgRating, ratingCount: rating.ratingCount,
  };
};

// ------------- REGISTER (step 1: create user + send OTP) -------------
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password, phone });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await Otp.deleteMany({ user: user._id });
  await Otp.create({ user: user._id, code, expiresAt, purpose: "signup" });

  try {
    await sendOtpEmail(user.email, code, user.name);
  } catch (err) {
    console.error("Failed to send signup OTP:", err.message);
    // Don't fail registration if email fails — user can resend from the OTP screen
  }

  res.status(201).json({
    success: true,
    data: {
      requiresOtp: true,
      purpose: "signup",
      email: user.email,
      message: "Verification code sent to your email.",
      ...(process.env.NODE_ENV !== "production" && { devOtp: code }),
    },
  });
});

// ------------- VERIFY SIGNUP -------------
export const verifySignup = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400);
    throw new Error("Email and code are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) { res.status(404); throw new Error("User not found"); }

  const otp = await Otp.findOne({ user: user._id, purpose: "signup" }).sort({ createdAt: -1 });
  if (!otp) { res.status(400); throw new Error("No active signup code. Please register again."); }
  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    res.status(400);
    throw new Error("Code expired. Please register again.");
  }
  if (otp.attempts >= 5) {
    await Otp.deleteOne({ _id: otp._id });
    res.status(429);
    throw new Error("Too many attempts. Please register again.");
  }
  if (otp.code !== String(code).trim()) {
    otp.attempts += 1;
    await otp.save();
    res.status(400);
    throw new Error("Invalid code");
  }

  await Otp.deleteOne({ _id: otp._id });

  res.json({
    success: true,
    data: {
      user: await publicUser(user),
      token: generateToken(user._id),
    },
  });
});

// ------------- LOGIN (step 1: verify password + send OTP) -------------
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (!user.isActive) { res.status(403); throw new Error("Your account has been deactivated"); }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await Otp.deleteMany({ user: user._id });
  await Otp.create({ user: user._id, code, expiresAt, purpose: "login" });

  try {
    await sendOtpEmail(user.email, code, user.name);
  } catch (err) {
    console.error("Failed to send login OTP:", err.message);
    res.status(500);
    throw new Error("Could not send verification email. Please try again.");
  }

  res.json({
    success: true,
    data: {
      requiresOtp: true,
      purpose: "login",
      email: user.email,
      message: "Verification code sent to your email.",
      ...(process.env.NODE_ENV !== "production" && { devOtp: code }),
    },
  });
});

// ------------- VERIFY LOGIN OTP -------------
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) { res.status(400); throw new Error("Email and code are required"); }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) { res.status(404); throw new Error("User not found"); }

  const otp = await Otp.findOne({ user: user._id, purpose: "login" }).sort({ createdAt: -1 });
  if (!otp) { res.status(400); throw new Error("No active code. Please log in again."); }
  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    res.status(400);
    throw new Error("Code expired. Please log in again.");
  }
  if (otp.attempts >= 5) {
    await Otp.deleteOne({ _id: otp._id });
    res.status(429);
    throw new Error("Too many attempts. Please log in again.");
  }
  if (otp.code !== String(code).trim()) {
    otp.attempts += 1;
    await otp.save();
    res.status(400);
    throw new Error("Invalid code");
  }

  await Otp.deleteOne({ _id: otp._id });

  res.json({
    success: true,
    data: {
      user: await publicUser(user),
      token: generateToken(user._id),
    },
  });
});

// ------------- RESEND OTP (works for both signup + login) -------------
export const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = "login" } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) { res.status(404); throw new Error("User not found"); }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await Otp.deleteMany({ user: user._id });
  await Otp.create({ user: user._id, code, expiresAt, purpose });
  await sendOtpEmail(user.email, code, user.name);

  res.json({
    success: true,
    data: {
      message: "New code sent",
      ...(process.env.NODE_ENV !== "production" && { devOtp: code }),
    },
  });
});

// ------------- ME / PROFILE -------------
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await publicUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  if (name !== undefined) { if (!name.trim()) { res.status(400); throw new Error("Name cannot be empty"); } user.name = name.trim(); }
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  res.json({ success: true, data: await publicUser(user) });
});
`);

// ============================================================
// 4. REPLACE: backend/src/routes/authRoutes.js
// ============================================================
write(path.join(backendDir, 'src/routes/authRoutes.js'), `
import express from "express";
import {
  register, login, getMe, updateProfile,
  verifyOtp, verifySignup, resendOtp,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/register", register);
router.post("/verify-signup", verifySignup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

export default router;
`);

// ============================================================
// 5. PATCH: backend/.env — add SMTP placeholders if missing
// ============================================================
try {
  const envPath = path.join(backendDir, '.env');
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, 'utf8');
    if (!env.includes('SMTP_USER')) {
      env += `\nSMTP_USER=your-email@gmail.com\nSMTP_PASS=your-16-char-app-password\n`;
      fs.writeFileSync(envPath, env, 'utf8');
      console.log('  🔧 Patched: backend/.env');
    }
  }
} catch (e) {}

// ============================================================
// 6. REPLACE: frontend/src/context/AuthContext.jsx
// ============================================================
write(path.join(frontendDir, 'src/context/AuthContext.jsx'), `
import { createContext, useContext, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("cp_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [activeOrg, setActiveOrg] = useState(() => {
    const stored = sessionStorage.getItem("cp_active_org");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // Login step 1: verify password, receive OTP request
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data.data; // { requiresOtp: true, email, devOtp?, purpose: "login" }
  };

  // Login step 2: verify OTP, get token
  const verifyOtp = async (email, code) => {
    const { data } = await api.post("/auth/verify-otp", { email, code });
    sessionStorage.setItem("cp_token", data.data.token);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  // Register step 1: create user, receive OTP request
  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data.data; // { requiresOtp: true, email, devOtp?, purpose: "signup" }
  };

  // Register step 2: verify signup OTP, get token
  const verifySignup = async (email, code) => {
    const { data } = await api.post("/auth/verify-signup", { email, code });
    sessionStorage.setItem("cp_token", data.data.token);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  const resendOtp = async (email, purpose = "login") => {
    const { data } = await api.post("/auth/resend-otp", { email, purpose });
    return data.data;
  };

  const logout = () => {
    sessionStorage.removeItem("cp_token");
    sessionStorage.removeItem("cp_user");
    sessionStorage.removeItem("cp_active_org");
    setUser(null);
    setActiveOrg(null);
  };

  const chooseOrg = (org, membership) => {
    const value = { org, membership };
    sessionStorage.setItem("cp_active_org", JSON.stringify(value));
    setActiveOrg(value);
  };

  const refreshUser = async () => {
    const { data } = await api.get("/auth/me");
    sessionStorage.setItem("cp_user", JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.patch("/auth/profile", payload);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, login, verifyOtp, register, verifySignup, resendOtp,
      logout, loading, setLoading, activeOrg, chooseOrg, updateProfile, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`);

// ============================================================
// 7. REPLACE: frontend/src/pages/Login.jsx (2-step)
// ============================================================
write(path.join(frontendDir, 'src/pages/Login.jsx'), `
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

const validateEmail = (v) => /^\\S+@\\S+\\.\\S+$/.test(v);
const validatePassword = (v) => v.length >= 6;

export default function Login() {
  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "" });
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

  const canSubmitCreds = validateEmail(form.email) && validatePassword(form.password) && !loading;

  const submitCredentials = async (e) => {
    e.preventDefault();
    setError("");
    if (!canSubmitCreds) return;
    try {
      setLoading(true);
      const result = await login(form.email, form.password);
      setEmailForOtp(result.email);
      if (result.devOtp) setDevOtp(result.devOtp);
      setStep(2);
      setResendCooldown(30);
      showToast("Verification code sent");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit code"); return; }
    try {
      setLoading(true);
      await verifyOtp(emailForOtp, otp);
      showToast("Verified — welcome back!");
      navigate("/organizations");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const result = await resendOtp(emailForOtp, "login");
      if (result.devOtp) setDevOtp(result.devOtp);
      setResendCooldown(30);
      showToast("New code sent");
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend code");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
        {step === 1 ? (
          <>
            <div className="text-center mb-6">
              <span className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center text-xl font-bold mb-3 mx-auto">V</span>
              <h1 className="text-2xl font-bold text-primary dark:text-sky-300">Welcome back</h1>
              <p className="text-slate-500 text-sm mt-1">Sign in to continue.</p>
            </div>

            <form onSubmit={submitCredentials} className="space-y-4" noValidate>
              {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="••••••••" />
                </div>
              </div>

              <button disabled={!canSubmitCreds}
                className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed">
                <LogIn className="w-4 h-4" />
                {loading ? "Verifying..." : "Continue"}
              </button>

              <p className="text-sm text-center text-slate-500">
                New here? <Link to="/register" className="text-accent font-medium hover:underline">Create an account</Link>
              </p>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                <p className="font-semibold text-slate-500 mb-2">Demo accounts:</p>
                <p><code>super@velocity.com</code> / <code>super123</code></p>
                <p><code>admin@greenride.com</code> / <code>admin123</code></p>
                <p><code>user@greenride.com</code> / <code>user123</code></p>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <span className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-primary dark:text-sky-300">Verify your identity</h1>
              <p className="text-slate-500 text-sm mt-1">
                We sent a 6-digit code to <strong>{emailForOtp}</strong>
              </p>
            </div>

            <form onSubmit={submitOtp} className="space-y-4">
              {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}

              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-md">
                  🧪 <strong>Dev mode:</strong> your code is <code className="font-mono font-bold">{devOtp}</code>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ""))}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <button disabled={otp.length !== 6 || loading}
                className="w-full bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Verifying..." : "Verify and sign in"}
              </button>

              <div className="flex items-center justify-between text-sm pt-2">
                <button type="button" onClick={() => { setStep(1); setOtp(""); setError(""); setDevOtp(""); }}
                  className="text-slate-500 hover:text-slate-700">
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
  );
}
`);

// ============================================================
// 8. REPLACE: frontend/src/pages/Register.jsx (2-step)
// ============================================================
write(path.join(frontendDir, 'src/pages/Register.jsx'), `
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, UserPlus, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

const validateEmail = (v) => /^\\S+@\\S+\\.\\S+$/.test(v);
const validatePassword = (v) => v.length >= 6;
const validateName = (v) => v.trim().length >= 2;

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

  const canSubmit = validateName(form.name) && validateEmail(form.email) && validatePassword(form.password) && !loading;

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    className: "w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition " +
      (errors[key] ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-accent"),
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
      showToast("Verification code sent to your email");
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
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
        {step === 1 ? (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <span className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center text-xl font-bold mb-3">V</span>
              <h1 className="text-2xl font-bold text-primary dark:text-sky-300">Create your account</h1>
              <p className="text-slate-500 text-sm mt-1">Join Velocity Pool in seconds.</p>
            </div>

            <form onSubmit={submitForm} className="space-y-4" noValidate>
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
                className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed">
                <UserPlus className="w-4 h-4" />
                {loading ? "Creating account..." : "Continue"}
              </button>

              <p className="text-sm text-center text-slate-500">
                Already have an account? <Link to="/login" className="text-accent font-medium hover:underline">Login</Link>
              </p>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <span className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-primary dark:text-sky-300">Verify your email</h1>
              <p className="text-slate-500 text-sm mt-1">
                We sent a 6-digit code to <strong>{emailForOtp}</strong>
              </p>
            </div>

            <form onSubmit={submitOtp} className="space-y-4">
              {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">⚠ {error}</div>}

              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-md">
                  🧪 <strong>Dev mode:</strong> your code is <code className="font-mono font-bold">{devOtp}</code>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ""))}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <button disabled={otp.length !== 6 || loading}
                className="w-full bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Verifying..." : "Verify and create account"}
              </button>

              <div className="flex items-center justify-between text-sm pt-2">
                <button type="button" onClick={() => { setStep(1); setOtp(""); setError(""); setDevOtp(""); }}
                  className="text-slate-500 hover:text-slate-700">
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
  );
}
`);

console.log('\n✅ FULL OTP patch applied!\n');
console.log('Next steps:\n');
console.log('  1. Install nodemailer (if not done yet):');
console.log('     cd backend');
console.log('     npm install nodemailer');
console.log('');
console.log('  2. Make sure backend/.env has:');
console.log('     SMTP_USER=your-email@gmail.com');
console.log('     SMTP_PASS=your-16-char-app-password');
console.log('');
console.log('  3. Add the same two variables on Vercel → backend → Settings → Environments');
console.log('');
console.log('  4. Commit & push:');
console.log('     cd ..');
console.log('     git add .');
console.log('     git commit -m "OTP on login AND registration"');
console.log('     git push');
console.log('');
console.log('  5. Redeploy BOTH projects on Vercel\n');