import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true, sparse: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: {
      type: String,
      enum: ["student", "alumni", "admin"],
      default: "student",
    },
    profilePicture: { type: String, default: null },
    coverPhoto: { type: String, default: null },
    bio: { type: String, maxlength: 500 },
    location: { type: String, maxlength: 100 },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    phoneVerificationCode: { type: String, select: false },
    phoneVerificationExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
    viewsToday: { type: Number, default: 0 },
    postViews: { type: Number, default: 0 },
    searchAppearances: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.phoneVerificationCode;
        return ret;
      },
    },
  },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ firstName: "text", lastName: "text", bio: "text" });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual: full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const User = mongoose.model("User", userSchema);
export default User;
