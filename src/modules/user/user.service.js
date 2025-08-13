import { asyncHandler, successResponse } from "../../utils/response.js";
import {
  decryptEncryption,
  generateEncryotion,
} from "../../utils/security/encryption.secuirty.js";
import {
  createRevokeToken,
  generateLoginCreadentials,
  logoutEnum,
} from "../../utils/security/token.security.js";
import * as DBservice from "../../DB/db.service.js";
import { roleEnum, UserModel } from "../../DB/models/User.model.js";
import {
  compareHash,
  generateHash,
} from "../../utils/security/hash.secuirty.js";
import {
  deleteResources,
  deleteResourcesByPrefix,
  destroyFile,
  uploadFile,
  uploadFiles,
} from "../../utils/multer/cloudinary.js";

export const logout = asyncHandler(async (req, res, next) => {
  const { flag } = req.body;
  let status = 200;
  switch (flag) {
    case logoutEnum.signoutFromAll:
      await DBservice.updateOne({
        model: UserModel,
        filter: {
          _id: req.decoded._id,
        },
        data: {
          changeCredentialsTime: new Date(),
        },
      });

      break;

    default:
      await createRevokeToken({ req });
      status = 201;
      break;
  }

  return successResponse({ res, status, data: {} });
});

export const profile = asyncHandler(async (req, res, next) => {
 const user = await DBservice.findById({
    model : UserModel,
      id : req.user._id,
      populate:[{ path : "messages"}]
    
  })
  user.phone = await decryptEncryption({ cipherText: req.user.phone });

  return successResponse({ res, data: { user } });
});

export const shareProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      _id: userId,
      confirmEmail: { $exists: true },
    },
  });
  return user
    ? successResponse({ res, data: { user } })
    : next(new Error("invalid account", { cause: 404 }));
});

export const updateBasicInfo = asyncHandler(async (req, res, next) => {
  if (req.body.phone) {
    req.body.phone = await generateEncryotion({ plainText: req.body.phone });
  }

  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: {
      _id: req.user._id,
    },
    data: req.body,
  });
  return user
    ? successResponse({ res, data: { user } })
    : next(new Error("invalid account", { cause: 404 }));
});

export const freezeAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (userId && req.user.role !== roleEnum.admin) {
    return next(new Error("not authorized account", { cause: 403 }));
  }

  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: {
      _id: userId || req.user._id,
      deletedAt: { $exists: false },
    },
    data: {
      deletedAt: Date.now(),
      deletedBy: req.user._id,
      changeCredentialsTime: new Date(),

      $unset: {
        restoredAt: 1,
        restoredBy: 1,
      },
    },
  });
  return user
    ? successResponse({ res, data: { user } })
    : next(new Error("account deleted", { cause: 404 }));
});

export const restoreAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (req.user.role !== roleEnum.admin) {
    filter.deletedBy = { $ne: userId };
  }

  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: {
    _id: userId,
    deletedAt: { $exists: true },
  },
    data: {
      $unset: {
        deletedAt: 1,
        deletedBy: 1,
      },
      restoredAt: Date.now(),
      restoredBy: req.user._id,
    },
  });

  return user
    ? successResponse({ res, data: { user } })
    : next(new Error("invalid account", { cause: 404 }));
});

export const deleteAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await DBservice.deleteOne({
    model: UserModel,
    filter: {
      _id: userId,
      deletedAt: { $exists: true },
    },
  });
  if (user.deletedCount) {
    await deleteResourcesByPrefix({prefix:`user/${userId}`})
  }
  return user.deletedCount
    ? successResponse({ res, data: { user } })
    : next(new Error("account deleted", { cause: 404 }));
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, password, flag } = req.body;
  if (
    !(await compareHash({
      plainText: oldPassword,
      hashValue: req.user.password,
    }))
  ) {
    return next(new Error("invalid old password"));
  }
  if (req.user.oldPasswords?.length) {
    for (const hashPassword of req.user.oldPasswords) {
      if (await compareHash({ plainText: password, hashValue: hashPassword })) {
        return next(new Error("this password is used brfore"));
      }
    }
  }
  let updateData = {};
  switch (flag) {
    case logoutEnum.signoutFromAll:
      updateData.changeCredentialsTime = new Date();
      break;
    case logoutEnum.signout:
      await createRevokeToken({ req });
      break;

    default:
      break;
  }
  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: {
      _id: req.user._id,
    },
    data: {
      password: await generateHash({ plainText: password }),
      updateData,
      $push: { oldPasswords: req.user.password },
    },
  });
  return user
    ? successResponse({ res, data: { user } })
    : next(new Error("invalid account", { cause: 404 }));
});

export const profileImage = asyncHandler(async (req, res, next) => {
  const { secure_url, public_id } = await uploadFile({
    file: req.file,
    path: `user/${req.user._id}`,
  });
  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: {
      _id: req.user._id,
    },
    data: {
      picture: { secure_url, public_id },
    },
    options: {
      new: false,
    },
  });
  if (user?.picture?.public_id) {
    await destroyFile({ public_id: user.picture.public_id });
  }
  return successResponse({ res, data: { user } });
});

export const profileCoverImage = asyncHandler(async (req, res, next) => {
 
  const oldUser = await DBservice.findOne({ 
    model: UserModel,
    filter: { _id: req.user._id },
  });

  if (oldUser?.cover?.length) {
    await deleteResources({
      public_ids: oldUser.cover.map((ele) => ele.public_id),
    });
  }

  const attachments = await uploadFiles({
    files: req.files,
    path: `user/${req.user._id}/cover`,
  });

  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: { _id: req.user._id },
    data: { cover: attachments },
    options: { new: true },
  });

  return successResponse({ res, data: { user } });
});


export const getNewLogin = asyncHandler(async (req, res, next) => {
  const creadentials = await generateLoginCreadentials({ user: req.user });

  return successResponse({
    res,
    message: "Done",
    data: { creadentials },
  });
});
