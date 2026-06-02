const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addressSchema = new Schema({
  label: { type: String, default: "home" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  country: { type: String, default: "" },
  phone: { type: String, default: "" },
  isDefault: { type: Boolean, default: false }
});

const customerSchema = new Schema({
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: "" },
  country: { type: String, default: "" },
  governorate: { type: String, default: "" },
  region: { type: String, default: "" },
  detailedAddress: { type: String, default: "" },
  password: { type: String },
  image: { type: String, default: "" },
  address: { type: String, default: "" },
  addresses: [addressSchema],
  wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  status: { type: String, enum: ["active", "blocked"], default: "active" },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastLogin: { type: Date },
  notes: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);
