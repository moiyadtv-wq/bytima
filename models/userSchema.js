const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  image: { type: String, default: "" },
  role: { type: String, enum: ["admin", "manager", "employee"], default: "employee" },
  permissions: [{ type: String }],
  status: { type: String, enum: ["active", "blocked"], default: "active" },
  lastLogin: { type: Date }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
