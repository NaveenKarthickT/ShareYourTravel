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
    from: '"ShareYourVehicle" <' + process.env.SMTP_USER + '>',
    to,
    subject: "Your ShareYourVehicle verification code",
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F8FAFC; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #00A3C4; border-radius: 12px; line-height: 48px; color: #fff; font-weight: bold; font-size: 22px;">V</div>
        </div>
        <h1 style="color: #0B2B4F; font-size: 22px; margin: 0 0 8px; text-align: center;">Verify your login</h1>
        <p style="color: #475569; font-size: 14px; text-align: center; margin: 0 0 24px;">
          Hi ${name}, use the code below to complete your sign-in.
        </p>
        <div style="background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0B2B4F; font-family: monospace;">
            ${otp}
          </div>
        </div>
        <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
          This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
