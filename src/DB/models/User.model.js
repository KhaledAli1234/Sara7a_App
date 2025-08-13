import mongoose from "mongoose";

export let genderEnum = { male: "male", female: "female" };
export let roleEnum = { user: "user", admin: "admin" };
export let providerEnum = { system: "system", google: "google" };

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 20,
    },

    lastName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 20,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === providerEnum.system ? true : false;
      },
    },
    oldPasswords: [String],
    forgotPasswordOtp: String,
    changeCredentialsTime: Date,
    phone: {
      type: String,
      required: function () {
        return this.provider === providerEnum.system ? true : false;
      },
    },
    gender: {
      type: String,
      enum: {
        values: Object.values(genderEnum),
        message: `gender only allow ${Object.values(genderEnum)}`,
      },
      default: genderEnum.male,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(roleEnum),
        message: `role only allow ${Object.values(roleEnum)}`,
      },
      default: roleEnum.user,
    },
    provider: {
      type: String,
      enum: {
        values: Object.values(providerEnum),
        message: `provider only allow ${Object.values(providerEnum)}`,
      },
      default: providerEnum.system,
    },

    confirmEmail: {
      type: Date,
    },
    confirmEmailOtp: {
      type: String,
    },
    ForgotPasswordOtp: { type: String },

    picture: [{ secure_url: String, public_id: String }],
    cover: [{ secure_url: String, public_id: String }],

    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    restoredAt: Date,
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    refresh_token: {
      type: String,
    },
    verificationCode: String,
    codeExpiresAt: Date,
    failedAttempts: {
      type: Number,
      default: 0,
    },
    banUntil: Date,
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

userSchema
  .virtual("fullName")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

userSchema.virtual("messages", {
  localField: "_id",
  foreignField: "receiverId",
  ref: "Message",
});

export const UserModel =
  mongoose.models.user || mongoose.model("User", userSchema);

UserModel.syncIndexes();
