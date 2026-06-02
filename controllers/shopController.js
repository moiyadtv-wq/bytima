const Product = require("../models/productSchema");
const Order = require("../models/orderSchema");
const Customer = require("../models/customerSchema");
const Setting = require("../models/settingSchema");
const whatsapp = require("../services/whatsapp");

exports.getCatalog = async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { _id: q.match(/^[0-9a-fA-F]{24}$/) ? q : undefined }
      ].filter(Boolean);
      if (!filter.$or.length) delete filter.$or;
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    const categories = await Product.distinct("category");
    res.render("shop/catalog", { products, categories, selectedCategory: category || "", searchTerm: q || "" });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) return res.status(404).render("404");
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).render("404");
    const related = await Product.find({ category: product.category, _id: { $ne: product._id } }).limit(4);
    res.render("shop/product", { product, related });
  } catch (err) { next(err); }
};

exports.getCart = (req, res) => {
  const cart = req.session.cart || [];
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.render("shop/cart", { cart, subtotal });
};

exports.addToCart = async (req, res, next) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) return res.status(404).json({ error: "Product not found" });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (!req.session.cart) req.session.cart = [];
    const cart = req.session.cart;
    const existing = cart.find(item => item.productId === req.params.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }

    res.json({ success: true, cartCount: cart.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) { next(err); }
};

exports.updateCart = (req, res) => {
  const { productId, quantity } = req.body;
  if (!req.session.cart) return res.json({ success: false });

  const item = req.session.cart.find(i => i.productId === productId);
  if (item) {
    item.quantity = Math.max(1, parseInt(quantity) || 1);
  }

  const subtotal = req.session.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ success: true, subtotal, cartCount: req.session.cart.reduce((s, i) => s + i.quantity, 0) });
};

exports.removeFromCart = (req, res) => {
  const { productId } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(i => i.productId !== productId);
  }
  res.redirect("/shop/cart");
};

exports.clearCart = (req, res) => {
  req.session.cart = [];
  res.redirect("/shop/cart");
};

exports.buyNow = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect("/shop");
    req.session.cart = [{ productId: product._id.toString(), name: product.name, price: product.price, quantity: 1, image: product.image }];
    res.redirect("/shop/checkout");
  } catch (err) { next(err); }
};

exports.getCheckout = async (req, res, next) => {
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.redirect("/shop/cart");
    const cust = await Customer.findById(req.session.customer.id);
    if (!cust) return res.redirect("/shop/profile");
    if (!cust.firstName || !cust.lastName || !cust.country || !cust.governorate || !cust.region || !cust.detailedAddress) {
      req.session.error = "complete_profile";
      return res.redirect("/shop/profile");
    }
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shamCashName = await Setting.get("shamCashName", "");
    const shamCashPhone = await Setting.get("shamCashPhone", "");
    res.render("shop/checkout", { cart, subtotal, customer: cust, shamCashName, shamCashPhone });
  } catch (err) { next(err); }
};

exports.placeOrder = async (req, res, next) => {
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.redirect("/shop/cart");

    const { customerName, customerPhone, customerAddress, customerCountry, customerGovernorate, customerRegion, notes, paymentMethod } = req.body;
    if (!customerName || !customerPhone || !customerAddress) {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const customer = req.session.customer || null;
      return res.render("shop/checkout", { cart, subtotal, customer, error: "checkout_fields_required" });
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const items = cart.map(i => ({
      product: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity
    }));

    let customerId = null;
    let isReturning = false;

    const profileUpdates = {
      name: customerName,
      phone: customerPhone,
      address: customerAddress || "",
      country: customerCountry || "",
      governorate: customerGovernorate || "",
      region: customerRegion || "",
      detailedAddress: customerAddress || ""
    };

    if (req.session.customer) {
      customerId = req.session.customer.id;
      const c = await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalOrders: 1, totalSpent: total },
        $set: profileUpdates
      });
      isReturning = c && c.totalOrders > 0;
    }

    const existing = await Customer.findOne({ phone: customerPhone });
    if (existing) {
      customerId = existing._id;
      isReturning = true;
      await Customer.findByIdAndUpdate(existing._id, {
        $inc: { totalOrders: 1, totalSpent: total },
        $set: profileUpdates
      });
    } else {
      const customer = await Customer.create({
        name: customerName, phone: customerPhone,
        address: customerAddress || "",
        country: customerCountry || "",
        governorate: customerGovernorate || "",
        region: customerRegion || "",
        detailedAddress: customerAddress || ""
      });
      customerId = customer._id;
    }

    const order = await Order.create({
      items, total,
      customer: customerId,
      customerName, customerPhone,
      customerAddress: customerAddress || "",
      notes: notes || "",
      paymentMethod: paymentMethod || "cash",
      isReturning
    });

    req.session.cart = [];

    const whatsappPhone = await Setting.get("whatsappPhone", process.env.ADMIN_PHONE || "");
    if (whatsappPhone) {
      whatsapp.notifyNewOrder(order, whatsappPhone).catch(() => {});
    }

    if (paymentMethod === "sham-cash") {
      req.session.success = "order_placed_msg";
      const shamCashName = await Setting.get("shamCashName", "");
      const shamCashPhone = await Setting.get("shamCashPhone", "");
      const msg = encodeURIComponent(
        `طلب جديد #${order.orderNumber}\nالمبلغ: ${total.toFixed(2)} ل.س\n` +
        (shamCashName ? `حساب شام كاش: ${shamCashName}\n` : "") +
        (shamCashPhone ? `رقم الحساب: ${shamCashPhone}\n` : "") +
        `\nالرجاء تحويل المبلغ وإرسال صورة الإيصال`
      );
      return res.redirect(`https://wa.me/${whatsappPhone}?text=${msg}`);
    }

    req.session.success = "order_placed_msg";
    res.redirect("/shop/orders/" + order._id);
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) return res.status(404).render("404");
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).render("404");
    res.render("shop/order", { order });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    if (!req.session.customer) return res.redirect("/shop");
    const customer = await Customer.findById(req.session.customer.id);
    if (!customer) return res.redirect("/shop");
    res.render("shop/profile", { customer });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    if (!req.session.customer) return res.redirect("/shop");
    const { firstName, lastName, phone, email, country, governorate, region, detailedAddress } = req.body;
    if (!firstName || !lastName || !country || !governorate || !region || !detailedAddress) {
      const customer = await Customer.findById(req.session.customer.id);
      req.session.error = "required_fields";
      return res.redirect("/shop/profile");
    }
    const update = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: firstName.trim() + " " + lastName.trim(),
      phone: phone || undefined,
      email: email || "",
      country,
      governorate,
      region,
      detailedAddress
    };
    if (req.file) update.image = "/uploads/" + req.file.filename;
    await Customer.findByIdAndUpdate(req.session.customer.id, update);
    req.session.customer.name = update.name;
    req.session.customer.phone = update.phone || req.session.customer.phone;
    if (update.image) req.session.customer.image = update.image;
    req.session.success = "profile_updated";
    res.redirect("/shop/profile");
  } catch (err) { next(err); }
};

exports.getSettings = async (req, res, next) => {
  try {
    const whatsappPhone = await Setting.get("whatsappPhone", "");
    const shamCashName = await Setting.get("shamCashName", "");
    const shamCashPhone = await Setting.get("shamCashPhone", "");
    res.render("shop/settings", { whatsappPhone, shamCashName, shamCashPhone });
  } catch (err) { next(err); }
};

exports.getChangePassword = (req, res) => {
  res.render("shop/change-password");
};

exports.changePassword = async (req, res, next) => {
  try {
    if (!req.session.customer) return res.redirect("/login");
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.session.error = "required_fields";
      return res.redirect("/shop/change-password");
    }
    if (newPassword !== confirmPassword) {
      req.session.error = "passwords_dont_match";
      return res.redirect("/shop/change-password");
    }
    if (newPassword.length < 6) {
      req.session.error = "password_too_short";
      return res.redirect("/shop/change-password");
    }
    const customer = await Customer.findById(req.session.customer.id);
    if (!customer) return res.redirect("/login");
    if (!customer.password) {
      req.session.error = "no_password_set";
      return res.redirect("/shop/change-password");
    }
    const match = await bcrypt.compare(currentPassword, customer.password);
    if (!match) {
      req.session.error = "invalid_current_password";
      return res.redirect("/shop/change-password");
    }
    customer.password = await bcrypt.hash(newPassword, 10);
    await customer.save();
    req.session.success = "password_changed";
    res.redirect("/shop/change-password");
  } catch (err) { next(err); }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    let orders = [];
    let searchPhone = "";
    if (req.session.customer) {
      orders = await Order.find({ customerPhone: req.session.customer.phone }).sort({ createdAt: -1 });
      searchPhone = req.session.customer.phone;
    } else {
      searchPhone = req.query.phone || "";
      if (searchPhone) {
        orders = await Order.find({ customerPhone: searchPhone }).sort({ createdAt: -1 });
      }
    }
    res.render("shop/my-orders", { orders, searchPhone });
  } catch (err) { next(err); }
};
