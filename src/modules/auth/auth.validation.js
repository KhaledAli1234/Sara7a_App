import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

export const sendForgotPassword = {
  body: joi.object().keys({
    email: generalFields.email.required()
    }).required()
};

export const verifyForgotPassword = {
  body: sendForgotPassword.body.append({
    otp: generalFields.otp.required()
    }).required()
};

export const resetPassword = {
  body: verifyForgotPassword.body.append({
    password: generalFields.password.required(),
    confirmPassword: generalFields.confirmPassword.required(),
    }).required()
};

export const login = {
  body: joi.object().keys({
    email:generalFields.email.required(),
      password:generalFields.password.required(),
    }).required().options({allowUnknown:false})
};

export const signup = {
  body: login.body
    .append({
      fullName: generalFields.fullName.required(),
      phone: generalFields.phone.required(),
      confirmPassword: generalFields.confirmPassword.required(),
    }).required()
};
