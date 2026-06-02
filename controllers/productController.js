const Product = require("../models/productSchema");
const fs = require("fs");
const path = require("path");
const activity = require("../services/activityLogger");

exports.getAll = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.render("products/index", { products });
  } catch (err) { next(err); }
};

exports.getAddForm = (req, res) => {
  res.render("products/add");
};

exports.create = async (req, res, next) => {
  try {
    if (req.files && req.files.image && req.files.image[0]) req.body.image = "/uploads/" + req.files.image[0].filename;
    if (req.files && req.files.images && req.files.images.length > 0) {
      req.body.images = req.files.images.map(f => ({ url: "/uploads/" + f.filename, alt: "", isPrimary: false }));
    }
    req.body.inStock = req.body.inStock === "on" || req.body.inStock === true;
    req.body.featured = req.body.featured === "on" || req.body.featured === true;
    const p = await Product.create(req.body);
    req.session.success = "product_added";
    activity.log(req, "added_product", "product", p._id, p.name);
    res.redirect("/products");
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.render("products/add", { error: messages.join(". ") });
    }
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).render("404");
    res.render("products/view", { product });
  } catch (err) { next(err); }
};

exports.getEditForm = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).render("404");
    res.render("products/edit", { product });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (req.files && req.files.image && req.files.image[0]) req.body.image = "/uploads/" + req.files.image[0].filename;
    if (req.files && req.files.images && req.files.images.length > 0) {
      req.body.images = req.files.images.map(f => ({ url: "/uploads/" + f.filename, alt: "", isPrimary: false }));
    }
    req.body.inStock = req.body.inStock === "on" || req.body.inStock === true;
    req.body.featured = req.body.featured === "on" || req.body.featured === true;
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
    if (!product) return res.status(404).render("404");
    req.session.success = "product_updated";
    activity.log(req, "updated_product", "product", product._id, product.name);
    res.redirect("/products");
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      const product = await Product.findById(req.params.id);
      return res.render("products/edit", { product, error: messages.join(". ") });
    }
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).render("404");
    req.session.success = "product_deleted";
    activity.log(req, "deleted_product", "product", product._id, product.name);
    res.redirect("/products");
  } catch (err) { next(err); }
};
