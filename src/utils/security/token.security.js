import jwt from "jsonwebtoken";
import { roleEnum, UserModel } from "../../DB/models/User.model.js";
import * as DBservice from "../../DB/db.service.js";
import { nanoid } from "nanoid";
import { TokenModel } from "../../DB/models/Token.model.js";

export const signatureLevelEnum = { bearer: "Bearer", system: "System" };
export const tokenTypeEnum = { access: "access", refresh: "refresh" };
export const logoutEnum = {
  signoutFromAll: "signoutFromAll",
  signout: "signout",
  stayLoggedIn: "stayLoggedIn",
};

export const generateToken = async ({
  payload = {},
  signature = process.env.ACCESS_USER_TOKEN_SIGNATURE,
  options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) },
} = {}) => {
  return jwt.sign(payload, signature, options);
};

export const verifyToken = async ({
  token = "",
  signature = process.env.ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
  return jwt.verify(token, signature);
};

export const getSigneture = async ({
  signatureLevel = signatureLevelEnum.bearer,
} = {}) => {
  let signatures = { accessSignature: undefined, refreshSignature: undefined };

  switch (signatureLevel) {
    case signatureLevelEnum.system:
      signatures.accessSignature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE;
      break;

    default:
      signatures.accessSignature = process.env.ACCESS_USER_TOKEN_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_USER_TOKEN_SIGNATURE;
      break;
  }

  return signatures;
};

export const decodedToken = async ({
  next,
  authorization = "",
  tokenType = tokenTypeEnum.access,
} = {}) => {
  const [bearer, token] = authorization?.split(" ") || [];

  if (!bearer || !token) {
    return next(new Error("Token is missing", { cause: 401 }));
  }

  let signatures = await getSigneture({ signatureLevel: bearer });

  const decoded = await verifyToken({
    token,
    signature:
      tokenType === tokenTypeEnum.access
        ? signatures.accessSignature
        : signatures.refreshSignature,
  });

  if (
    decoded.jti &&
    (await DBservice.findOne({
      model: TokenModel,
      filter: { jti: decoded.jti },
    }))
  ) {
    return next(new Error("invalid login credentials", { cause: 401 }));
  }

  const user = await DBservice.findById({
    model: UserModel,
    id: decoded._id,
  });

  if (!user) {
    return next(new Error("Not register account", { cause: 404 }));
  }

  if (user.changeCredentialsTime?.getTime() > decoded.iat * 1000) {
    return next(new Error("invalid login credential", { cause: 401 }));
  }

  return { user, decoded };
};

export const generateLoginCreadentials = async ({ user } = {}) => {
  let signatures = await getSigneture({
    signatureLevel:
      user.role != roleEnum.user
        ? signatureLevelEnum.system
        : signatureLevelEnum.bearer,
  });

  const jwtid = nanoid();

  const access_token = await generateToken({
    payload: { _id: user._id },
    signature: signatures.accessSignature,
    options: {
      jwtid,
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    },
  });

  const refresh_token = await generateToken({
    payload: { _id: user._id },
    signature: signatures.refreshSignature,
    options: {
      jwtid,
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
    },
  });

  return { access_token, refresh_token };
};

export const createRevokeToken = async ({ req } = {}) => {
  await DBservice.create({
    model: TokenModel,
    data: [
      {
        jti: req.decoded.jti,
        expiresIn:
          req.decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        userId: req.decoded._id,
      },
    ],
  });
  return true;
};
