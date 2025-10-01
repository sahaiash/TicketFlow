import nodemailer from "nodemailer";

export const sendMail = async (to, subject, text, fromEmail = null) => {
  try {
    // Skip sending email if admin is assigning ticket to themselves
    if (fromEmail && fromEmail === to) {
      console.log("📧 Skipping email - admin assigned ticket to themselves:", to);
      return {
        messageId: `skipped-${Date.now()}`,
        accepted: [],
        rejected: [],
        pending: [],
        response: "Email skipped - admin assigned to themselves"
      };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: process.env.MAILTRAP_SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });

    // Use admin email as sender if provided, otherwise use default
    const senderEmail = fromEmail || 'support@ticketflow.com';
    const senderName = fromEmail ? 'TicketFlow Admin' : 'TicketFlow Support';

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      text,
    });

    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail error", error.message);
    throw error;
  }
};