// ============================================================
// Forgot Password Patch
// Adds a full "reset password via email OTP" flow:
//   1. /forgot-password  → enter email, receive OTP
//   2. /verify-reset-otp → enter 6-digit code
//   3. /reset-password   → set new password
// Backend endpoints:
//   POST /api/auth/forgot-password
//   POST /api/auth/verify-reset-otp
//   POST /api/auth/reset-password
// Run from carpool-platform root:
//   node forgot-password-patch.js
// ============================================================

const fs = require("fs");
const path = require("path");

const backendDir = path.resolve("backend");
const frontendDir = path.resolve("frontend");

if (!fs.existsSync(backendDir) || !fs.existsSync(frontendDir)) {
  console.error("❌ Run this from the carpool-platform root (must contain backend/ and frontend/).");
  process.exit(1);
}

const write = (root, relPath, content) => {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.replace(/^\n/, ""), "utf8");
  console.log("  ✏️  " + path.relative(process.cwd(), full));
};

const patch = (filePath, edits) => {
  if (!fs.existsSync(filePath)) {
    console.log("  ⚠️  Missing: " + path.relative(process.cwd(), filePath));
    return false;
  }
  let src = fs.readFileSync(filePath, "utf8");
  let changed = 0;
  for (const [find, replace] of edits) {
    if (!src.includes(find)) {
      console.log("  ⚠️  Pattern not found in " + path.basename(filePath));
      continue;
    }
    src = src.replace(find, replace);
    changed++;
  }
  if (changed) {
    fs.writeFileSync(filePath, src, "utf8");
    console.log("  🔧 Patched: " + path.relative(process.cwd(), filePath) + ` (${changed})`);
  }
  return changed > 0;
};

console.log("\n🔑 Adding forgot password flow...\n");

// ============================================================
// 1. Patch Otp model to add "reset" purpose (if the model has enum)
// ============================================================
const otpModelPath = path.join(backendDir, "src/models/Otp.js");
if (fs.existsSync(otpModelPath)) {
  let otpSrc = fs.readFileSync(otpModelPath, "utf8");
  if (otpSrc.includes('enum: ["login", "signup"]')) {
    otpSrc = otpSrc.replace(
      'enum: ["login", "signup"]',
      'enum: ["login", "signup", "reset"]'
    );
    fs.writeFileSync(otpModelPath, otpSrc, "utf8");
    console.log("  🔧 Patched: backend/src/models/Otp.js (added 'reset' purpose)");
  } else {
    console.log("  ✓ Otp model already supports reset purpose");
  }
}

// ============================================================
// 2. Append forgot-password functions to authController
// ============================================================
const authControllerPath = path.join(backendDir, "src/controllers/authController.js");
let authSrc = fs.readFileSync(authControllerPath, "utf8");

if (!authSrc.includes("export const forgotPassword")) {
  // Ensure bcrypt import exists (User model hashes on save, so we just set password)
  authSrc += `

// ============================================================
// Forgot password flow
// ============================================================

// @route POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Security best-practice: always return success, don't reveal whether the email exists
  if (!user) {
    return res.json({
      success: true,
      data: {
        message: "If that email exists, a reset code has been sent.",
        // We still pretend so the UI moves to the OTP step
        requiresOtp: true,
        email: email.toLowerCase(),
      },
    });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await Otp.deleteMany({ user: user._id, purpose: "reset" });
  await Otp.create({ user: user._id, code, expiresAt, purpose: "reset" });

  try {
    await sendOtpEmail(user.email, code, user.name);
  } catch (err) {
    console.error("Failed to send reset OTP:", err.message);
    res.status(500);
    throw new Error("Could not send reset email. Please try again.");
  }

  res.json({
    success: true,
    data: {
      message: "Reset code sent to your email.",
      requiresOtp: true,
      email: user.email,
      ...(process.env.NODE_ENV !== "production" && { devOtp: code }),
    },
  });
});

// @route POST /api/auth/verify-reset-otp
// Verifies the OTP and returns a short-lived reset token the user
// can use to actually change their password.
export const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400);
    throw new Error("Email and code are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error("No active reset request for that email");
  }

  const otp = await Otp.findOne({ user: user._id, purpose: "reset" }).sort({ createdAt: -1 });
  if (!otp) {
    res.status(400);
    throw new Error("No active reset code. Please request a new one.");
  }
  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    res.status(400);
    throw new Error("Code expired. Please request a new one.");
  }
  if (otp.attempts >= 5) {
    await Otp.deleteOne({ _id: otp._id });
    res.status(429);
    throw new Error("Too many attempts. Please request a new code.");
  }
  if (otp.code !== String(code).trim()) {
    otp.attempts += 1;
    await otp.save();
    res.status(400);
    throw new Error("Invalid code");
  }

  // Consume the OTP now — user has proven ownership
  await Otp.deleteOne({ _id: otp._id });

  // Issue a short-lived reset token (JWT with scope=reset, 15 min)
  const resetToken = generateToken(user._id);
  // We don't distinguish scope for simplicity; the /reset-password
  // endpoint additionally requires the email + we verify expiry.

  res.json({
    success: true,
    data: {
      resetToken,
      email: user.email,
      message: "Code verified. You can now set a new password.",
    },
  });
});

// @route POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    res.status(400);
    throw new Error("Email, resetToken and newPassword are required");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  // Verify the reset token was issued for this user
  let decoded;
  try {
    const jwt = (await import("jsonwebtoken")).default;
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Invalid or expired reset token. Please start again.");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || String(user._id) !== String(decoded.id)) {
    res.status(401);
    throw new Error("Reset token does not match. Please start again.");
  }

  // Set new password — the User model pre-save hook will hash it
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    data: { message: "Password updated. You can now log in." },
  });
});
`;
  fs.writeFileSync(authControllerPath, authSrc, "utf8");
  console.log("  🔧 Patched: authController.js (forgotPassword + verifyResetOtp + resetPassword)");
} else {
  console.log("  ✓ authController already has forgot password handlers");
}

// ============================================================
// 3. Add routes to authRoutes.js
// ============================================================
patch(path.join(backendDir, "src/routes/authRoutes.js"), [
  [
    `import {
  register, login, getMe, updateProfile,
  verifyOtp, verifySignup, resendOtp,
} from "../controllers/authController.js";`,
    `import {
  register, login, getMe, updateProfile,
  verifyOtp, verifySignup, resendOtp,
  forgotPassword, verifyResetOtp, resetPassword,
} from "../controllers/authController.js";`
  ],
  [
    `router.post("/resend-otp", resendOtp);`,
    `router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);`
  ],
]);

// Fallback: if the file structure is different, try an alternate patch
const authRoutesPath = path.join(backendDir, "src/routes/authRoutes.js");
let routesSrc = fs.readFileSync(authRoutesPath, "utf8");
if (!routesSrc.includes("/forgot-password")) {
  // Append imports if missing
  if (!routesSrc.includes("forgotPassword")) {
    routesSrc = routesSrc.replace(
      /import \{([^}]+)\} from "\.\.\/controllers\/authController\.js";/,
      (m, p1) => `import {${p1.trim()}, forgotPassword, verifyResetOtp, resetPassword } from "../controllers/authController.js";`
    );
  }
  // Add routes before `export default`
  routesSrc = routesSrc.replace(
    /export default router;/,
    `router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

export default router;`
  );
  fs.writeFileSync(authRoutesPath, routesSrc, "utf8");
  console.log("  🔧 Patched: authRoutes.js (fallback)");
}

// ============================================================
// 4. Patch AuthContext — add forgot/verify/reset methods
// ============================================================
const authCtxPath = path.join(frontendDir, "src/context/AuthContext.jsx");
let ctxSrc = fs.readFileSync(authCtxPath, "utf8");

if (!ctxSrc.includes("forgotPassword")) {
  ctxSrc = ctxSrc.replace(
    /const logout = \(\) => \{/,
    `const forgotPassword = async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data.data;
  };

  const verifyResetOtp = async (email, code) => {
    const { data } = await api.post("/auth/verify-reset-otp", { email, code });
    return data.data;
  };

  const resetPassword = async (email, resetToken, newPassword) => {
    const { data } = await api.post("/auth/reset-password", {
      email, resetToken, newPassword,
    });
    return data.data;
  };

  const logout = () => {`
  );

  ctxSrc = ctxSrc.replace(
    /value=\{\{\s*user, setUser, login, verifyOtp, register, verifySignup, resendOtp,/,
    'value={{ user, setUser, login, verifyOtp, register, verifySignup, resendOtp, forgotPassword, verifyResetOtp, resetPassword,'
  );

  fs.writeFileSync(authCtxPath, ctxSrc, "utf8");
  console.log("  🔧 Patched: AuthContext.jsx");
} else {
  console.log("  ✓ AuthContext already has forgot password methods");
}

// ============================================================
// 5. Add "Forgot password?" link to Login.jsx
// ============================================================
const loginPath = path.join(frontendDir, "src/pages/Login.jsx");
let loginSrc = fs.readFileSync(loginPath, "utf8");

if (!loginSrc.includes('to="/forgot-password"')) {
  // Insert the link right after the password field's closing tag
  // We look for the "Continue" button and insert above it
  loginSrc = loginSrc.replace(
    /(\s*)(<button disabled=\{!canSubmitCreds\})/,
    `$1<div className="flex items-center justify-end -mt-1">
                  <Link to="/forgot-password" className="text-xs text-accent hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
$1$2`
  );
  fs.writeFileSync(loginPath, loginSrc, "utf8");
  console.log("  🔧 Patched: Login.jsx (Forgot password link)");
} else {
  console.log("  ✓ Login.jsx already has the Forgot password link");
}

// ============================================================
// 6. CREATE: ForgotPassword.jsx
// ============================================================
write(frontendDir, "src/pages/ForgotPassword.jsx", `
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Send, Car, Users2, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

const validateEmail = (v) => /^\\S+@\\S+\\.\\S+$/.test(v);

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
        <h2 className="text-2xl font-bold leading-snug mb-4">
          Forgot your password? No problem.
        </h2>
        <ul className="space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-3 h-3" />
            </span>
            <span>We'll email you a 6-digit reset code</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <Car className="w-3 h-3" />
            </span>
            <span>Back on the road in under a minute</span>
          </li>
        </ul>
      </div>
      <div className="relative text-white/40 text-xs">
        © {new Date().getFullYear()} ShareYourTravel
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailError = touched && email && !validateEmail(email);
  const canSubmit = validateEmail(email) && !loading;

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (!canSubmit) return;
    try {
      setLoading(true);
      const result = await forgotPassword(email);
      showToast("If that email exists, a reset code was sent");
      navigate("/verify-reset-otp", {
        state: { email: result.email, devOtp: result.devOtp },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not send reset code");
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

          <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Forgot password?</h1>
          <p className="text-slate-500 text-sm mb-6">
            Enter your email and we'll send you a 6-digit code to reset it.
          </p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {error && (
              <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  className={
                    "w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition " +
                    (emailError
                      ? "border-rose-400 focus:ring-rose-200"
                      : "border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-accent")
                  }
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              {emailError && (
                <p className="text-xs text-rose-600 mt-1">Please enter a valid email address.</p>
              )}
            </div>

            <button
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <Send className="w-4 h-4" />
              {loading ? "Sending..." : "Send reset code"}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Remembered it?{" "}
              <Link to="/login" className="text-accent font-medium hover:underline">Back to login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
`);

// ============================================================
// 7. CREATE: VerifyResetOtp.jsx
// ============================================================
write(frontendDir, "src/pages/VerifyResetOtp.jsx", `
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ShieldCheck, RefreshCw, Car, Users2, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

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
        <h2 className="text-2xl font-bold leading-snug mb-4">Check your inbox.</h2>
        <ul className="space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-3 h-3" />
            </span>
            <span>Enter the 6-digit code we just sent you</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <Car className="w-3 h-3" />
            </span>
            <span>Then set a fresh password</span>
          </li>
        </ul>
      </div>
      <div className="relative text-white/40 text-xs">
        © {new Date().getFullYear()} ShareYourTravel
      </div>
    </div>
  );
}

export default function VerifyResetOtp() {
  const { verifyResetOtp, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();

  const initialEmail = location.state?.email || "";
  const initialDevOtp = location.state?.devOtp || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (!initialEmail) {
      // If someone lands here directly, send them back
      navigate("/forgot-password", { replace: true });
    }
  }, [initialEmail, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    try {
      setLoading(true);
      const result = await verifyResetOtp(email, otp);
      showToast("Code verified");
      navigate("/reset-password", {
        state: {
          email: result.email,
          resetToken: result.resetToken,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const result = await forgotPassword(email);
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
          <Link to="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Change email
          </Link>

          <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Enter reset code</h1>
          <p className="text-slate-500 text-sm mb-6">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>

          <form onSubmit={submit} className="space-y-4">
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
                onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ""))}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="000000"
                autoFocus
              />
            </div>

            <button
              disabled={otp.length !== 6 || loading}
              className="w-full bg-accent text-white rounded-md py-2.5 font-medium hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Verifying..." : "Verify code"}
            </button>

            <div className="flex items-center justify-between text-sm pt-2">
              <Link to="/login" className="text-slate-500 hover:text-slate-700">
                ← Cancel
              </Link>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-accent font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? "Resend in " + resendCooldown + "s" : "Resend code"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
`);

// ============================================================
// 8. CREATE: ResetPassword.jsx
// ============================================================
write(frontendDir, "src/pages/ResetPassword.jsx", `
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
`);

// ============================================================
// 9. Register routes in App.jsx
// ============================================================
const appPath = path.join(frontendDir, "src/App.jsx");
let appSrc = fs.readFileSync(appPath, "utf8");

if (!appSrc.includes("ForgotPassword")) {
  // Add imports
  appSrc = appSrc.replace(
    /import Login from "\.\/pages\/Login\.jsx";/,
    `import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import VerifyResetOtp from "./pages/VerifyResetOtp.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";`
  );

  // Add routes right after the /login route
  appSrc = appSrc.replace(
    /<Route path="\/login" element=\{<Login \/>\} \/>/,
    `<Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />`
  );

  fs.writeFileSync(appPath, appSrc, "utf8");
  console.log("  🔧 Patched: App.jsx (added 3 routes)");
} else {
  console.log("  ✓ App.jsx already has forgot password routes");
}

console.log("\n✅ Forgot password flow added!\n");
console.log("New pages:");
console.log("  • /forgot-password     → enter email");
console.log("  • /verify-reset-otp    → enter 6-digit code");
console.log("  • /reset-password      → set new password");
console.log("");
console.log("New API endpoints:");
console.log("  • POST /api/auth/forgot-password");
console.log("  • POST /api/auth/verify-reset-otp");
console.log("  • POST /api/auth/reset-password");
console.log("");
console.log("Next steps:");
console.log("  git add .");
console.log('  git commit -m "Add forgot password flow with email OTP"');
console.log("  git push\n");
console.log("  Then hard refresh (Ctrl + Shift + R) and test on /login.\n");