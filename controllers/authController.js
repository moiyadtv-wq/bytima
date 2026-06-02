const bcrypt = require("bcrypt");
const User = require("../models/userSchema");
const Customer = require("../models/customerSchema");

exports.getLogin = (req, res) => {
  res.render("auth/login");
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.render("auth/login", { error: "invalid_email_password" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.render("auth/login", { error: "invalid_email_password" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render("auth/login", { error: "invalid_email_password" });
    req.session.user = { id: user._id, email: user.email, role: user.role, name: user.name || user.email };
    res.redirect("/");
  } catch (err) { next(err); }
};

exports.customerLogin = async (req, res, next) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) return res.render("auth/login", { error: "login_required" });

    const isEmail = login.includes("@");
    const customer = isEmail
      ? await Customer.findOne({ email: login.toLowerCase().trim() })
      : await Customer.findOne({ phone: login.trim() });

    if (!customer) return res.render("auth/login", { error: "invalid_login" });
    if (!customer.password) return res.render("auth/login", { error: "invalid_login" });

    const match = await bcrypt.compare(password, customer.password);
    if (!match) return res.render("auth/login", { error: "invalid_login" });

    req.session.customer = { id: customer._id, name: customer.name, phone: customer.phone, image: customer.image || "" };
    res.redirect("/shop");
  } catch (err) { next(err); }
};

exports.customerRegister = async (req, res, next) => {
  try {
    const { firstName, lastName, country, email, phone, password } = req.body;
    if (!firstName || !lastName || !country || !email || !phone || !password) {
      return res.render("auth/login", { error: "required_fields" });
    }

    const emailStr = email.toLowerCase().trim();
    if (!emailStr.endsWith("@gmail.com")) {
      return res.render("auth/login", { error: "gmail_only" });
    }
    const emailExists = await Customer.findOne({ email: emailStr });
    if (emailExists) return res.render("auth/login", { error: "email_already_registered" });

    const existing = await Customer.findOne({ phone });
    if (existing) return res.render("auth/login", { error: "phone_already_registered" });

    const name = firstName.trim() + " " + lastName.trim();
    const customerData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name,
      country,
      phone,
      email: emailStr
    };
    customerData.password = await bcrypt.hash(password, 10);
    const customer = await Customer.create(customerData);

    req.session.customer = { id: customer._id, name: customer.name, phone: customer.phone, image: customer.image || "" };
    req.session.success = "customer_register_success";
    res.redirect("/shop");
  } catch (err) { next(err); }
};

exports.guestLogin = (req, res) => {
  delete req.session.user;
  delete req.session.customer;
  res.redirect("/shop");
};

exports.logout = (req, res) => {
  const isCustomer = !!req.session.customer;
  req.session.destroy();
  res.redirect(isCustomer ? "/shop" : "/login");
};