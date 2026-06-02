const mongoose = require("mongoose");

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  image: { type: String, default: "" },
  gender: { type: String, default: "ذكر" },
  country: { type: String, default: "سوريا" },
  age: { type: Number, default: 25 },
  status: { type: String, enum: ["active", "blocked"], default: "active" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Person", personSchema);
