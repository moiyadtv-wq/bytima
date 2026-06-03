const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Order = require("../models/orderSchema");
const Setting = require("../models/settingSchema");
const Customer = require("../models/customerSchema");
const ActivityLog = require("../models/activityLogSchema");
const activity = require("../services/activityLogger");
const bcrypt = require("bcrypt");

exports.getDashboard = async (req, res, next) => {
  try {
    const customersCount = await Customer.countDocuments();
    const productsCount = await Product.countDocuments();
    const usersCount = await User.countDocuments();
    const ordersCount = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const recentCustomers = await Customer.find().sort({ createdAt: -1 }).limit(5);
    const recentProducts = await Product.find().sort({ createdAt: -1 }).limit(5);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    res.render("dashboard", { customersCount, productsCount, usersCount, ordersCount, pendingOrders, recentCustomers, recentProducts, recentOrders });
  } catch (err) {
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { q, status, archived } = req.query;
    const filter = {};
    if (archived === "1") filter.archived = true;
    else filter.archived = { $ne: true };
    if (status && status !== "all") filter.status = status;
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { customerName: { $regex: safe, $options: "i" } },
        { customerPhone: { $regex: safe, $options: "i" } },
        { orderNumber: { $regex: safe, $options: "i" } }
      ];
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.render("admin/orders", { orders, q: q || "", statusFilter: status || "all", showArchived: archived === "1" });
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status });
    req.session.success = "order_status_updated";
    activity.log(req, "updated_order_status", "order", req.params.id, `${order ? order.customerName : ''} → ${status}`);
    res.redirect("/admin/orders");
  } catch (err) { next(err); }
};

exports.toggleArchiveOrder = async (req, res, next) => {
  console.log("toggleArchiveOrder called");
  console.log("params:", JSON.stringify(req.params));
  console.log("body keys:", Object.keys(req.body || {}));
  try {
    const id = req.params.id;
    if (!id) throw new Error("No id param");
    const order = await Order.findById(id).lean();
    if (!order) throw new Error("Order not found");
    await Order.updateOne({ _id: id }, { $set: { archived: !order.archived } });
    req.session.success = order.archived ? "order_unarchived" : "order_archived";
    res.redirect("/admin/orders" + (order.archived ? "" : "?archived=1"));
  } catch (err) {
    console.error("toggleArchiveOrder error:", err.message);
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.render("admin/users", { users });
  } catch (err) {
    next(err);
  }
};

exports.toggleRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.role = user.role === "admin" ? "employee" : "admin";
      await user.save();
    }
    res.redirect("/admin/users");
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/admin/users");
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const shamCashName = await Setting.get("shamCashName", "BY TIMA");
    const shamCashPhone = await Setting.get("shamCashPhone", "");
    const whatsappPhone = await Setting.get("whatsappPhone", "");
    res.render("admin/settings", { shamCashName, shamCashPhone, whatsappPhone });
  } catch (err) { next(err); }
};

exports.saveSettings = async (req, res, next) => {
  try {
    const { shamCashName, shamCashPhone, whatsappPhone } = req.body;
    await Setting.set("shamCashName", shamCashName || "");
    await Setting.set("shamCashPhone", shamCashPhone || "");
    await Setting.set("whatsappPhone", whatsappPhone || "");
    req.session.success = "payment_settings_saved";
    res.redirect("/admin/settings");
  } catch (err) { next(err); }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    let query = {};
    if (q) {
      const regex = new RegExp(q, "i");
      query = { $or: [{ name: regex }, { email: regex }, { phone: regex }, { firstName: regex }, { lastName: regex }] };
    }
    let customers = await Customer.find(query).sort({ createdAt: -1 }).lean();
    const customerIds = customers.map(c => c._id);
    const orderCounts = await Order.aggregate([
      { $match: { customer: { $in: customerIds } } },
      { $group: { _id: "$customer", count: { $sum: 1 } } }
    ]);
    const countMap = {};
    orderCounts.forEach(o => { countMap[o._id.toString()] = o.count; });
    customers = customers.map(c => ({ ...c, orderCount: countMap[c._id.toString()] || 0 }));
    res.render("admin/customers", { customers, search: q });
  } catch (err) { next(err); }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).render("404");
    const orders = await Order.find({ customer: req.params.id }).sort({ createdAt: -1 }).limit(10);
    res.render("admin/customer-view", { customer, orders });
  } catch (err) { next(err); }
};

exports.getEditCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).render("404");
    const countriesList = ["سوريا", "مصر", "الأردن", "لبنان", "فلسطين", "الإمارات", "السعودية", "قطر", "عمان", "البحرين", "الكويت", "العراق", "ليبيا", "تونس", "الجزائر", "المغرب", "السودان", "اليمن"];
    const countries = countriesList.map(c =>
      `<option value="${c}" ${customer.country === c ? 'selected' : ''}>${c}</option>`
    ).join("");
    res.render("admin/customer-edit", { customer, countries });
  } catch (err) { next(err); }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, password, country, governorate, region, detailedAddress, status, notes } = req.body;
    const update = { name, email, phone, country, governorate, region, detailedAddress, status, notes };
    Object.keys(update).forEach(k => { if (update[k] === undefined || update[k] === null) delete update[k]; });
    if (password && password.length >= 6) {
      update.password = await bcrypt.hash(password, 10);
    }
    await Customer.findByIdAndUpdate(req.params.id, update);
    req.session.success = "customer_updated";
    res.redirect("/admin/customers/" + req.params.id);
  } catch (err) { next(err); }
};

exports.toggleCustomerStatus = async (req, res, next) => {
  try {
    const c = await Customer.findById(req.params.id);
    if (c) {
      c.status = c.status === "blocked" ? "active" : "blocked";
      await c.save();
    }
    res.redirect("/admin/customers");
  } catch (err) { next(err); }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    req.session.success = "customer_deleted";
    res.redirect("/admin/customers");
  } catch (err) { next(err); }
};

exports.getPaymentSettings = async (req, res, next) => {
  try {
    const shamCashName = await Setting.get("shamCashName", "BY TIMA");
    const shamCashPhone = await Setting.get("shamCashPhone", "");
    const whatsappPhone = await Setting.get("whatsappPhone", "");
    res.render("admin/payment", { shamCashName, shamCashPhone, whatsappPhone });
  } catch (err) { next(err); }
};

exports.getActivity = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const total = await ActivityLog.countDocuments();
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.render("admin/activity", { logs, page, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.savePaymentSettings = async (req, res, next) => {
  try {
    const { shamCashName, shamCashPhone, whatsappPhone } = req.body;
    await Setting.set("shamCashName", shamCashName || "");
    await Setting.set("shamCashPhone", shamCashPhone || "");
    await Setting.set("whatsappPhone", whatsappPhone || "");
    req.session.success = "payment_settings_saved";
    res.redirect("/admin/payment-settings");
  } catch (err) { next(err); }
};

exports.getChangePassword = (req, res) => {
  res.render("admin/change-password");
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.session.error = "required_fields";
      return res.redirect("/admin/change-password");
    }
    if (newPassword !== confirmPassword) {
      req.session.error = "passwords_dont_match";
      return res.redirect("/admin/change-password");
    }
    if (newPassword.length < 6) {
      req.session.error = "password_too_short";
      return res.redirect("/admin/change-password");
    }
    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect("/login");
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      req.session.error = "invalid_current_password";
      return res.redirect("/admin/change-password");
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    req.session.success = "password_changed";
    res.redirect("/admin/change-password");
  } catch (err) { next(err); }
};

exports.getAddEmployee = async (req, res, next) => {
  try {
    const employees = await User.find({ role: { $ne: "customer" } }).sort({ createdAt: -1 });
    res.render("admin/add-employee", { employees });
  } catch (err) { next(err); }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    await User.create({ email: req.body.email, password: hashed, name: req.body.name, role: "employee" });
    req.session.success = "employee_added";
    res.redirect("/admin/add-employee");
  } catch (err) { next(err); }
};

exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no_file" });
    const imagePath = "/uploads/" + req.file.filename;
    const type = req.body.type; // "user" or "customer"
    if (type === "customer" && req.session.customer) {
      await Customer.findByIdAndUpdate(req.session.customer.id, { image: imagePath });
      req.session.customer.image = imagePath;
    } else if (req.session.user) {
      await User.findByIdAndUpdate(req.session.user.id, { image: imagePath });
      req.session.user.image = imagePath;
    }
    res.json({ image: imagePath });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect("/login");
    res.render("admin/profile", { user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect("/login");
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.file) user.image = "/uploads/" + req.file.filename;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (currentPassword && newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        req.session.error = "passwords_dont_match";
        return res.redirect("/admin/profile");
      }
      if (newPassword.length < 6) {
        req.session.error = "password_too_short";
        return res.redirect("/admin/profile");
      }
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        req.session.error = "invalid_current_password";
        return res.redirect("/admin/profile");
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }
    await user.save();
    req.session.user.name = user.name;
    req.session.user.image = user.image || "";
    req.session.success = "profile_updated";
    res.redirect("/admin/profile");
  } catch (err) { next(err); }
};
