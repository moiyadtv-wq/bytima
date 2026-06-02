const router = require("express").Router();
const Customer = require("../models/customerSchema");
const Product = require("../models/productSchema");

router.get("/customers", async (req, res, next) => {
  try { res.json(await Customer.find()); } catch (err) { next(err); }
});

router.get("/customers/:id", async (req, res, next) => {
  try { res.json(await Customer.findById(req.params.id)); } catch (err) { next(err); }
});

router.get("/products", async (req, res, next) => {
  try { res.json(await Product.find()); } catch (err) { next(err); }
});

router.get("/products/:id", async (req, res, next) => {
  try { res.json(await Product.findById(req.params.id)); } catch (err) { next(err); }
});

router.post("/products", async (req, res, next) => {
  try { res.status(201).json(await Product.create(req.body)); } catch (err) { next(err); }
});

router.put("/products/:id", async (req, res, next) => {
  try { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (err) { next(err); }
});

router.delete("/products/:id", async (req, res, next) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); } catch (err) { next(err); }
});

module.exports = router;
