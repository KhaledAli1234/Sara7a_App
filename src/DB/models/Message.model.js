import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 200000,
      require: function () {
        return this.attachments?.length ? false : true;
      },
    },
    attachments: [{ secure_url: String, public_id: String }],
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

MessageModel.syncIndexes();
