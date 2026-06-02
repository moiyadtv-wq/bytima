const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productImageSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String, default: "" },
  isPrimary: { type: Boolean, default: false }
});

const specificationSchema = new Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
});

const productSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, default: "" },
  sku: { type: String, default: "" },
  barcode: { type: String, default: "" },
  price: { type: Number, required: true },
  oldPrice: { type: Number, default: 0 },
  compareAtPrice: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  category: { type: String, default: "" },
  tags: [{ type: String }],
  description: { type: String, default: "" },
  ingredients: { type: String, default: "" },
  usage: { type: String, default: "" },
  specifications: [specificationSchema],
  weight: { type: String, default: "" },
  unit: { type: String, default: "" },
  inStock: { type: Boolean, default: true },
  quantity: { type: Number, default: 0 },
  lowStockAlert: { type: Number, default: 5 },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "inactive", "draft"], default: "active" },
  image: { type: String, default: "" },
  images: [productImageSchema]
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
