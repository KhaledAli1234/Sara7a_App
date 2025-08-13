import { EventEmitter } from "node:events";
import { sendEmail } from "../email/send.email.js";
import { verifyEmailTemplate } from "../email/templates/verify.email.template.js";

export const emailEvent = new EventEmitter();

emailEvent.on("confirmEmail", async (data) => {
  await sendEmail({
    to: data.to,
    subject: data.subject || "confirm-Email",
    html: verifyEmailTemplate({ otp: data.otp }),
  }).catch((error) => {
    console.log(`fail to send email to ${data.to}`);
  });
});

emailEvent.on("sendForgotPassword", async (data) => {
  await sendEmail({
    to: data.to,
    subject: data.subject || "forgot-Email",
    html: verifyEmailTemplate({ otp: data.otp, title: data.title }),
  }).catch((error) => {
    console.log(`fail to send email to ${data.to}`);
  });
});
