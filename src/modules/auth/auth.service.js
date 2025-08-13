import { providerEnum, UserModel } from "../../DB/models/User.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import * as DBservice from "../../DB/db.service.js";
import {
  compareHash,
  generateHash,
} from "../../utils/security/hash.secuirty.js";
import { generateEncryotion } from "../../utils/security/encryption.secuirty.js";
import { generateLoginCreadentials } from "../../utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { emailEvent } from "../../utils/events/email.event.js";
import { customAlphabet } from "nanoid";
import { sendVerificationCode } from "../../utils/email/send.Verification.js";

async function verifyGoogleAccount({ idToken } = {}) {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.WEB_CLIENT_ID.split(","),
  });
  const payload = ticket.getPayload();
  return payload;
}

export const signup = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phone } = req.body;

  const existing = await DBservice.findOne({
    model: UserModel,
    filter: { email },
  });

  if (existing) {
    return next(new Error("Email already exists", { cause: 409 }));
  }
  const hashPassword = await generateHash({ plainText: password });
  const encPhone = await generateEncryotion({ plainText: phone });
  const otp = customAlphabet("0123456789", 6)();
  const confirmEmailOtp = await generateHash({ plainText: otp });
  const [user] = await DBservice.create({
    model: UserModel,
    data: [
      {
        fullName,
        email,
        password: hashPassword,
        phone: encPhone,
        confirmEmailOtp,
      },
    ],
  });

  emailEvent.emit("confirmEmail", { to: email, otp: otp });

  return successResponse({
    status: 201,
    res,
    message: "user added successfully",
    data: { user },
  });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      confirmEmailOtp: { $exists: true },
    },
  });

  if (!user) {
    return next(
      new Error("in-valid account or already verify", { cause: 404 })
    );
  }
  if (
    !(await compareHash({ plainText: otp, hashValue: user.confirmEmailOtp }))
  ) {
    return next(new Error("in-valid otp"));
  }
  const updateUser = await DBservice.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      $set: { confirmEmail: Date.now() },
      $unset: { confirmEmailOtp: true },
      $inc: { __v: 1 },
    },
  });


  return updateUser.matchedCount
    ? successResponse({ status: 200, res, data: {} })
    : next(new Error("fail to confirm user email"));
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await DBservice.findOne({
    model: UserModel,
    filter: { email, provider: providerEnum.system },
  });

  if (!user) {
    return next(new Error("invalid login", { cause: 404 }));
  }
  if (!user.confirmEmail) {
    return next(new Error("please verify your account first ", { cause: 404 }));
  }

  const match = await compareHash({
    plainText: password,
    hashValue: user.password,
  });

  if (!match) {
    return next(new Error("invalid login data", { cause: 404 }));
  }

  const creadentials = await generateLoginCreadentials({ user });
  return successResponse({
    res,
    message: "login successfully",
    data: { creadentials },
  });
});

export const signupWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const { email, email_verified, picture, name } = await verifyGoogleAccount({
    idToken,
  });

  if (!email_verified) {
    return next(new Error("not verified account", { cause: 400 }));
  }
  const user = await DBservice.findOne({
    model: UserModel,
    filter: { email },
  });

  if (user) {
    if (user.provider === providerEnum.google) {
      return loginWithGmail(req, res, next);
    }
    return next(new Error("Email exist", { cause: 409 }));
  }

  const [newUser] = await DBservice.create({
    model: UserModel,
    data: [
      {
        fullName: name,
        email,
        picture,
        confirmEmail: Date.now(),
        provider: providerEnum.google,
      },
    ],
  });
  const creadentials = await generateLoginCreadentials({ user: newUser });

  return successResponse({
    status: 201,
    res,
    message: "user added successfully",
    data: { creadentials },
  });
});

export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const { email, email_verified } = await verifyGoogleAccount({
    idToken,
  });

  if (!email_verified) {
    return next(new Error("not verified account", { cause: 400 }));
  }
  const user = await DBservice.findOne({
    model: UserModel,
    filter: { email, provider: providerEnum.google },
  });

  if (!user) {
    return next(new Error("invalid login data or provider", { cause: 404 }));
  }
  const creadentials = await generateLoginCreadentials({ user });

  return successResponse({
    status: 200,
    res,
    message: "user added successfully",
    data: { creadentials },
  });
});

export const sendCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
    },
  });
  if (!user) {
    return next(
      new Error("Invalid or already verified account", { cause: 404 })
    );
  }
  await sendVerificationCode(user);
  return successResponse({
    res,
    message: "Verification code sent to your email",
  });
});

export const verifyCode = asyncHandler(async (req, res, next) => {
  const { email, code } = req.body;

  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      email,
      verificationCode: { $exists: true },
      codeExpiresAt: { $exists: true },
    },
  });

  if (!user) {
    return next(
      new Error("Invalid account or already verified", { cause: 404 })
    );
  }

  if (user.banUntil && user.banUntil > new Date()) {
    const seconds = Math.ceil((user.banUntil - new Date()) / 1000);
    return next(
      new Error(`You are banned. Try again in ${seconds} seconds`, {
        cause: 403,
      })
    );
  } else if (user.banUntil && user.banUntil < new Date()) {
    user.banUntil = undefined;
    user.failedAttempts = 0;
    await user.save();
  }

  if (!user.codeExpiresAt || user.codeExpiresAt < new Date()) {
    return next(new Error("Code has expired", { cause: 400 }));
  }

  if (user.verificationCode !== code) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;

    if (user.failedAttempts >= 5) {
      user.banUntil = new Date(Date.now() + 5 * 60 * 1000);
      user.failedAttempts = 0;
    }

    await user.save();
    return next(new Error("Invalid OTP", { cause: 401 }));
  }

  user.verificationCode = undefined;
  user.codeExpiresAt = undefined;
  user.failedAttempts = undefined;
  user.banUntil = undefined;
  user.confirmEmail = new Date();

  await user.save();

  return successResponse({
    res,
    message: "Email verified successfully",
  });
});

export const sendForgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const otp = customAlphabet("0123456789", 6)();

  const hashedOtp = await generateHash({ plainText: otp });

  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      deleteAt: { $exists: false },
      provider: providerEnum.system,
    },
    data: {
      ForgotPasswordOtp: hashedOtp,
    },
    options: { new: true }
  });

  if (!user) {
    return next(new Error("invalid account", { cause: 404 }));
  }

  
  console.log("✅ User after sendForgotPassword:", user);

  emailEvent.emit("sendForgotPassword", {
    to: email,
    subject: "forgot password",
    title: "reset password",
    otp,
  });

  return successResponse({ res });
});


export const verifyForgotPassword = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      deleteAt: { $exists: false },
      ForgotPasswordOtp: { $exists: true }, 
      provider: providerEnum.system,
    },
  });
  if (!user) {
    return next(new Error("invalid account", { cause: 404 }));
  }
  if (
    !(await compareHash({ plainText: otp, hashValue: user.ForgotPasswordOtp }))
  ) {
    return next(new Error("invalid otp", { cause: 400 }));
  }
  return successResponse({ res });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, password } = req.body;
  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      deleteAt: { $exists: false },
      ForgotPasswordOtp: { $exists: true },
      provider: providerEnum.system,
    },
  });
  if (!user) {
    return next(new Error("invalid account", { cause: 404 }));
  }
  if (
    !(await compareHash({ plainText: otp, hashValue: user.ForgotPasswordOtp }))
  ) {
    return next(new Error("invalid otp", { cause: 400 }));
  }
  await DBservice.updateOne({
    model: UserModel,
    filter: {
      email,
    },
    data: {
      password: await generateHash({ plainText: password }),
      changeCredentialsTime: new Date(),
    },
  });

  return successResponse({ res });
});
