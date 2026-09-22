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

  return `
  <div style="font-family: Inter, -apple-system, Segoe UI, Roboto, sans-serif; background: #F8FAFC; padding: 32px 16px;">
    <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">

      <!-- Top accent bar -->
      <div style="height: 6px; background: ${c.accent};"></div>

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
          ${c.heading}
        </h1>

        <!-- Intro -->
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          ${c.intro(name)}
        </p>

        <!-- Code box -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="color: #94A3B8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
            ${c.codeLabel}
          </div>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0B2B4F; font-family: 'SF Mono', Menlo, Consolas, monospace;">
            ${otp}
          </div>
        </div>

        <!-- Expiry -->
        <p style="color: #64748B; font-size: 12px; line-height: 1.6; margin: 0 0 8px;">
          ${c.expiry}
        </p>

        <!-- Footer note -->
        <p style="color: #94A3B8; font-size: 12px; line-height: 1.6; margin: 0; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          ${c.footer}
        </p>

      </div>

      <!-- Bottom meta -->
      <div style="background: #F8FAFC; padding: 16px 28px; text-align: center; color: #94A3B8; font-size: 11px; border-top: 1px solid #E2E8F0;">
        © ${new Date().getFullYear()} ShareYourTravel · Vehicle Pooling Platform
      </div>

    </div>
  </div>
  `;
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
