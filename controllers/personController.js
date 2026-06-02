const Person = require("../models/personSchema");
const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const activity = require("../services/activityLogger");

exports.getPeople = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    let query = {};
    if (q) {
      const regex = new RegExp(q, "i");
      query = { $or: [{ name: regex }, { email: regex }, { phone: regex }] };
    }
    const people = await Person.find(query).sort({ createdAt: -1 });
    res.render("index", { people, search: q });
  } catch (err) { next(err); }
};

exports.viewPerson = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).render("404");
    res.render("view", { person });
  } catch (err) { next(err); }
};

exports.getEditPerson = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).render("404");
    res.render("edit", { person });
  } catch (err) { next(err); }
};

exports.editPerson = async (req, res, next) => {
  try {
    const person = await Person.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.session.success = "customer_updated";
    res.redirect("/customers");
  } catch (err) { next(err); }
};

exports.deletePerson = async (req, res, next) => {
  try {
    await Person.findByIdAndDelete(req.params.id);
    res.redirect("/customers");
  } catch (err) { next(err); }
};

exports.getAddEmployeeForm = async (req, res) => {
  res.render("add");
};

exports.createEmployee = async (req, res, next) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    await User.create({ email: req.body.email, password: hashed, name: req.body.name, role: "employee" });
    req.session.success = "employee_added";
    res.redirect("/customers");
  } catch (err) { next(err); }
};
