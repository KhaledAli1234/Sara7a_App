import nodemailer from "nodemailer";

export async function sendEmail({
  from = process.env.EMAIL,
  to = "",
  cc = "",
  bcc = "",
  subject = "Sara7a App",
  text = "",
  html = "",
  attachments = [],
} = {}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"Route ❤️✅" <${from}>`,
    to,
    cc,
    bcc,
    subject,
    text,
    html,
    attachments,
  });
}
