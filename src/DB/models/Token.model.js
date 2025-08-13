import mongoose from "mongoose";
const tokenSchema = new mongoose.Schema(
  {
    jti: { type: String, require: true, unique: true },
    expiresIn: { type: Number, require: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    token: String,
    expiresAt: { type: Date, required: true }
  },
  {
    timestamps: true,
  }
);

export const TokenModel =
  mongoose.models.Token || mongoose.model("Token", tokenSchema);

TokenModel.syncIndexes(); 
