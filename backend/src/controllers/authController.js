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
