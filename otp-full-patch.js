// ============================================================
// OTP Email Context Patch
// Makes the OTP email wording match the situation:
//   • login  → "Verify your login"
//   • signup → "Welcome to ShareYourTravel"
//   • reset  → "Reset your password"
// Run from carpool-platform root:
//   node otp-email-context-patch.js
// ============================================================

const fs = require("fs");
const path = require("path");

const backendDir = path.resolve("backend");
if (!fs.existsSync(backendDir)) {
  console.error("❌ Run this from the carpool-platform root (must contain backend/).");
  process.exit(1);
}

const write = (relPath, content) => {
  const full = path.join(backendDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.replace(/^\n/, ""), "utf8");
  console.log("  ✏️  " + path.relative(process.cwd(), full));
};

console.log("\n✉️  Making OTP emails purpose-aware...\n");

// ============================================================
// 1. Rewrite sendOtp.js to accept a `purpose` param
// ============================================================
write("src/utils/sendOtp.js", `
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Per-purpose copy + styling
const COPY = {
  login: {
    subject: "Your login verification code",
    heading: "Verify your login",
    intro: (name) =>
      "Hi " + name + ", use the code below to finish signing in to ShareYourTravel.",
    codeLabel: "Login code",
    expiry: "This code expires in <strong>10 minutes</strong>.",
    accent: "#00A3C4",
    footer: "If you didn't try to log in, you can safely ignore this email.",
  },
  signup: {
    subject: "Welcome to ShareYourTravel — verify your email",
    heading: "Welcome aboard!",
    intro: (name) =>
      "Hi " + name + ", thanks for signing up. Use the code below to verify your email address.",
    codeLabel: "Signup code",
    expiry: "This code expires in <strong>10 minutes</strong>.",
    accent: "#10B981",
    footer: "If you didn't create an account, you can safely ignore this email.",
  },
  reset: {
    subject: "Reset your ShareYourTravel password",
    heading: "Reset your password",
    intro: (name) =>
      "Hi " + name + ", we received a request to reset your password. Use the code below to continue.",
    codeLabel: "Password reset code",
    expiry: "This code expires in <strong>10 minutes</strong>.",
    accent: "#F43F5E",
    footer:
      "If you didn't request a password reset, please ignore this email — your password will stay the same.",
  },
};

const buildHtml = ({ name, otp, purpose }) => {
  const c = COPY[purpose] || COPY.login;

  return \`
  <div style="font-family: Inter, -apple-system, Segoe UI, Roboto, sans-serif; background: #F8FAFC; padding: 32px 16px;">
    <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">

      <!-- Top accent bar -->
      <div style="height: 6px; background: \${c.accent};"></div>

      <div style="padding: 32px 28px;">

        <!-- Logo -->
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
          <div style="width: 40px; height: 40px; background: #0B2B4F; border-radius: 10px; display: inline-block; text-align: center; line-height: 40px; color: #00A3C4; font-weight: 800; font-size: 16px; letter-spacing: -0.5px;">
            SYT
          </div>
          <div style="font-weight: 700; color: #0B2B4F; font-size: 15px;">ShareYourTravel</div>
        </div>

        <!-- Heading -->
        <h1 style="color: #0B2B4F; font-size: 22px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.01em;">
          \${c.heading}
        </h1>

        <!-- Intro -->
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          \${c.intro(name)}
        </p>

        <!-- Code box -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="color: #94A3B8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
            \${c.codeLabel}
          </div>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0B2B4F; font-family: 'SF Mono', Menlo, Consolas, monospace;">
            \${otp}
          </div>
        </div>

        <!-- Expiry -->
        <p style="color: #64748B; font-size: 12px; line-height: 1.6; margin: 0 0 8px;">
          \${c.expiry}
        </p>

        <!-- Footer note -->
        <p style="color: #94A3B8; font-size: 12px; line-height: 1.6; margin: 0; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          \${c.footer}
        </p>

      </div>

      <!-- Bottom meta -->
      <div style="background: #F8FAFC; padding: 16px 28px; text-align: center; color: #94A3B8; font-size: 11px; border-top: 1px solid #E2E8F0;">
        © \${new Date().getFullYear()} ShareYourTravel · Vehicle Pooling Platform
      </div>

    </div>
  </div>
  \`;
};

// purpose: "login" | "signup" | "reset"
export const sendOtpEmail = async (to, otp, name = "there", purpose = "login") => {
  const c = COPY[purpose] || COPY.login;

  const mailOptions = {
    from: '"ShareYourTravel" <' + process.env.SMTP_USER + ">",
    to,
    subject: c.subject,
    html: buildHtml({ name, otp, purpose }),
  };

  await transporter.sendMail(mailOptions);
};

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
`);

// ============================================================
// 2. Patch authController.js to pass purpose to sendOtpEmail
// ============================================================
const authControllerPath = path.join(backendDir, "src/controllers/authController.js");
let src = fs.readFileSync(authControllerPath, "utf8");
let changed = 0;

// Signup OTP
src = src.replace(
  /await sendOtpEmail\(user\.email, code, user\.name\);\s*\n\s*\} catch \(err\) \{\s*\n\s*console\.error\("Failed to send signup OTP:", err\.message\);/,
  'await sendOtpEmail(user.email, code, user.name, "signup");\n  } catch (err) {\n    console.error("Failed to send signup OTP:", err.message);'
);

// Login OTP
src = src.replace(
  /await sendOtpEmail\(user\.email, code, user\.name\);\s*\n\s*\} catch \(err\) \{\s*\n\s*console\.error\("Failed to send login OTP:", err\.message\);/,
  'await sendOtpEmail(user.email, code, user.name, "login");\n  } catch (err) {\n    console.error("Failed to send login OTP:", err.message);'
);

// Reset OTP
src = src.replace(
  /await sendOtpEmail\(user\.email, code, user\.name\);\s*\n\s*\} catch \(err\) \{\s*\n\s*console\.error\("Failed to send reset OTP:", err\.message\);/,
  'await sendOtpEmail(user.email, code, user.name, "reset");\n  } catch (err) {\n    console.error("Failed to send reset OTP:", err.message);'
);

// Resend OTP — pass purpose through
src = src.replace(
  /await sendOtpEmail\(user\.email, code, user\.name\);/g,
  'await sendOtpEmail(user.email, code, user.name, purpose);'
);

fs.writeFileSync(authControllerPath, src, "utf8");

const signupCount = (src.match(/"signup"/g) || []).length;
const loginCount = (src.match(/"login"/g) || []).length;
const resetCount = (src.match(/"reset"/g) || []).length;

console.log('  🔧 Patched: authController.js');
console.log('     • signup sends  purpose="signup"');
console.log('     • login sends   purpose="login"');
console.log('     • reset sends   purpose="reset"');
console.log('     • resend passes purpose from request body');

console.log("\n✅ OTP emails now have distinct content per purpose!\n");
console.log("What each email now says:");
console.log("  LOGIN:");
console.log('    Subject: "Your login verification code"');
console.log('    Heading: "Verify your login"');
console.log('    Accent:  teal (#00A3C4)');
console.log("");
console.log("  SIGNUP:");
console.log('    Subject: "Welcome to ShareYourTravel — verify your email"');
console.log('    Heading: "Welcome aboard!"');
console.log('    Accent:  green (#10B981)');
console.log("");
console.log("  PASSWORD RESET:");
console.log('    Subject: "Reset your ShareYourTravel password"');
console.log('    Heading: "Reset your password"');
console.log('    Accent:  red (#F43F5E)');
console.log("");
console.log("Next steps:");
console.log("  git add .");
console.log('  git commit -m "Distinct OTP email content per purpose"');
console.log("  git push\n");