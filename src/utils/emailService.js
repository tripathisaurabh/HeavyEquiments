import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  service: "gmail", // or use SMTP (e.g. Mailtrap, SendGrid)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"EqpRent" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("📩 Email sent successfully to", to);
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
}
