const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const loginLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, refPath: "userModel" },
  userModel: { type: String, enum: ["Customer", "User"] },
  email: { type: String, required: true },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  success: { type: Boolean, required: true },
  failReason: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("LoginLog", loginLogSchema);
