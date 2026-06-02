const router = require("express").Router();
const Customer = require("../models/customerSchema");
const Product = require("../models/productSchema");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const ALLOWED_PRODUCT_FIELDS = ["name", "nameAr", "description", "descriptionAr", "price", "category", "stock", "image", "images", "active", "featured"];

function sanitizeProduct(body) {
  const clean = {};
  for (const key of ALLOWED_PRODUCT_FIELDS) {
    if (body[key] !== undefined) clean[key] = body[key];
  }
  return clean;
}

router.get("/customers", requireAuth, async (req, res, next) => {
  try {
    const customers = await Customer.find().select("-password");
    res.json(customers);
  } catch (err) { next(err); }
});

router.get("/customers/:id", requireAuth, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).select("-password");
    if (!customer) return res.status(404).json({ error: "Not found" });
    res.json(customer);
  } catch (err) { next(err); }
});

router.get("/products", async (req, res, next) => {
  try { res.json(await Product.find()); } catch (err) { next(err); }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch (err) { next(err); }
});

router.post("/products", requireAdmin, async (req, res, next) => {
  try {
    const clean = sanitizeProduct(req.body);
    res.status(201).json(await Product.create(clean));
  } catch (err) { next(err); }
});

router.put("/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const clean = sanitizeProduct(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, clean, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch (err) { next(err); }
});

router.delete("/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { next(err); }
});

module.exports = router;