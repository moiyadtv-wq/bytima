const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: "" }
});

const statusHistorySchema = new Schema({
  status: { type: String, required: true },
  note: { type: String, default: "" },
  changedBy: { type: Schema.Types.ObjectId, ref: "User" },
  changedAt: { type: Date, default: Date.now }
});

const orderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  discount: {
    code: { type: String, default: "" },
    amount: { type: Number, default: 0 }
  },
  total: { type: Number, required: true },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, default: "" },
  customerCity: { type: String, default: "" },
  notes: { type: String, default: "" },
  adminNotes: { type: String, default: "" },
  paymentMethod: { type: String, enum: ["cash", "sham-cash", "card", "transfer"], default: "cash" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  transactionId: { type: String, default: "" },
  shippingMethod: { type: String, default: "" },
  trackingNumber: { type: String, default: "" },
  isReturning: { type: Boolean, default: false },
  status: { type: String, enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"], default: "pending" },
  statusHistory: [statusHistorySchema],
  notified: { type: Boolean, default: false },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

orderSchema.pre("save", async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = "ORD-" + String(count + 1).padStart(5, "0");
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
