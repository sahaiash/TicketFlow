import nodemailer from "nodemailer";

// SMTP_* preferred; MAILTRAP_SMTP_* kept as fallback so the existing .env works.
const host = process.env.SMTP_HOST || process.env.MAILTRAP_SMTP_HOST;
const port = Number(process.env.SMTP_PORT || process.env.MAILTRAP_SMTP_PORT);
const user = process.env.SMTP_USER || process.env.MAILTRAP_SMTP_USER;
const pass = process.env.SMTP_PASS || process.env.MAILTRAP_SMTP_PASS;

// One pooled transporter for the whole app - avoids a fresh TCP/TLS handshake
// per email. `secure` follows the SMTPS convention: implicit TLS on 465,
// STARTTLS otherwise.
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  pool: true,
  maxConnections: 5,
});

// Always send from our own (verified) address - sending "from" an arbitrary
// user's domain fails SPF/DKIM/DMARC on real providers. The acting user's
// address goes in replyTo instead, so replies still reach them.
const FROM = '"TicketFlow" <support@ticketflow.com>';

export const sendMail = async (to, subject, text, replyToEmail = null) => {
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      text,
      ...(replyToEmail ? { replyTo: replyToEmail } : {}),
    });

    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Mail error", error.message);
    throw error;
  }
};
