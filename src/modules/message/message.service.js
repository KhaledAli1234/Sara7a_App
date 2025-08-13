import { asyncHandler, successResponse } from "../../utils/response.js";
import * as DBservice from "../../DB/db.service.js";
import { UserModel } from "../../DB/models/User.model.js";
import { MessageModel } from "../../DB/models/Message.model.js";
import { uploadFiles } from "../../utils/multer/cloudinary.js";

export const sendMessage = asyncHandler(async (req, res, next) => {
  if (!req.body.content && !req.files) {
    return next(new Error("message content is required"));
  }

  const { receiverId } = req.params;
  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      _id: receiverId,
      deletedAt: { $exists: false },
      confirmEmail: { $exists: true },
    },
  });

  if (!user) {
    return next(new Error("invalid recipient account", { cause: 404 }));
  }

  const { content } = req.body;
  let attachments = [];

  if (req.files) {
    attachments = await uploadFiles({
      files: req.files,
      path: `messages/${receiverId}`,
    });
  }

  const [message] = await DBservice.create({
    model: MessageModel,
    data: [
      {
        content,
        attachments,
        receiverId,
        senderId: req.user?._id,
      },
    ],
  });
  return successResponse({ res, status: 201, data: { message } });
});

export const listMessages = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const messages = await DBservice.find({
    model: MessageModel,
    filter: {
      $or: [
        { senderId: req.user?._id, receiverId: userId },
        { senderId: userId, receiverId: req.user?._id },
      ],
      deletedAt: { $exists: false },
    },
    sort: { createdAt: -1 },
    skip,
    limit,
  });

  const total = await DBservice.count({
    model: MessageModel,
    filter: {
      $or: [
        { senderId: req.user?._id, receiverId: userId },
        { senderId: userId, receiverId: req.user?._id },
      ],
      deletedAt: { $exists: false },
    },
  });

  return successResponse({
    res,
    data: {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

export const getMessageById = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;

  const message = await DBservice.findOne({
    model: MessageModel,
    filter: {
      _id: messageId,
      $or: [
        { senderId: req.user?._id },
        { receiverId: req.user?._id }
      ],
      deletedAt: { $exists: false }
    }
  });

  if (!message) {
    return next(new Error("message not found", { cause: 404 }));
  }

  return successResponse({ res, data: { message } });
});

export const deleteMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;

  

  const message = await DBservice.findOneAndUpdate({
    model: MessageModel,
    filter:{
    _id: messageId,
    $or: [
      { senderId: req.user._id },
      { receiverId: req.user._id }
    ],
    $or: [
      { deletedAt: { $exists: false } },
      { deletedAt: null }
    ]
  },
    data: { deletedAt: new Date() }
  });

  if (!message) {
    return next(new Error("message not found or not allowed to delete", { cause: 404 }));
  }
  return successResponse({
    res,
    status: 200,
    message: "Message deleted successfully",
    data: { message }
  });
});


export const hardDeleteMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;

  const message = await DBservice.findOneAndDelete({
    model: MessageModel,
    filter: {
      _id: messageId,
      senderId: req.user?._id, 
    },
  });

  if (!message) {
    return next(
      new Error("message not found or not allowed to delete", { cause: 404 })
    );
  }

  return successResponse({ res, message: "Message deleted successfully",data: { message } });
});
