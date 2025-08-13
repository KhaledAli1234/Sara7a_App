import joi from "joi";
import { asyncHandler } from "../utils/response.js";
import { Types } from "mongoose";
import { genderEnum } from "../DB/models/User.model.js";
import { fileValidation } from "../utils/multer/local.multer.js";

export const generalFields = {
  email: joi.string().email({
    minDomainSegments: 2,
    maxDomainSegments: 3,
    tlds: { allow: ["net", "com", "edu"] },
  }),

  password: joi
    .string()
    .pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)),
  fullName: joi
    .string()
    .pattern(new RegExp(/^[A-Z][a-z]{1,19}\s{1}[A-Z][a-z]{1,19}$/))
    .min(2)
    .max(20),
  phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)),
  gender: joi.string().valid(...Object.values(genderEnum)),
  confirmPassword: joi.string().valid(joi.ref("password")),
  otp: joi.string().pattern(new RegExp(/^\d{6}$/)),
  id: joi.string().custom((value, helper) => {
    return Types.ObjectId.isValid(value) || helper.message("invalid ObjectId");
  }),
  file: {
    fieldname: joi.string(),
    originalname: joi.string(),
    encoding: joi.string(),
    mimetype: joi.string(),
    finalPath: joi.string(),
    destination: joi.string(),
    filename: joi.string(),
    path: joi.string(),
    size: joi.number().positive(),
  },
}

export const validation = (schema) => {
  return asyncHandler(async (req, res, next) => {
    
    const validationError = [];
    for (const key of Object.keys(schema)) {
      const validationRuselt = schema[key].validate(req[key], {
        abortEarly: false,
      });

      if (validationRuselt.error) {
        validationError.push(validationRuselt.error?.details);
      }
    }
    if (validationError.length) {
      return res
        .status(400)
        .json({ error_message: "validation error", error: validationError });
    }

    return next();
  });
};
