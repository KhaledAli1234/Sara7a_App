import { sendEmail } from "./send.email.js";
import { generateVerificationCode } from "../security/encryption.secuirty.js";


export const sendVerificationCode = async (user) => {
  const code = generateVerificationCode();

  user.verificationCode = code;
  user.codeExpiresAt = new Date(Date.now() + 2 * 60 * 1000); 
  user.failedAttempts = 0;
  user.banUntil = undefined;

  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your Verification Code",
    html: `<h1>Your OTP Code is: ${code}</h1>`,
  });

  console.log("OTP sent to:", user.email, "code:", code);
};