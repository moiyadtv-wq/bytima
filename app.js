require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore;
const helmet = require('helmet');
const i18n = require("./middleware/i18n");

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not set in .env');
  process.exit(1);
}

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 }
}));

app.use(i18n);
app.use(require("./middleware/flash"));

app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.customer = req.session.customer || null;
  res.locals.session = req.session;
  try {
    const Setting = require("./models/settingSchema");
    res.locals.whatsappPhone = await Setting.get("whatsappPhone", "963934034810");
  } catch {
    res.locals.whatsappPhone = "963934034810";
  }

  // Set currentPage based on request path
  const path = req.path;
  if (path === "/" || path === "/dashboard") res.locals.currentPage = "dashboard";
  else if (path === "/shop") res.locals.currentPage = "shop";
  else if (path.startsWith("/shop/cart")) res.locals.currentPage = "cart";
  else if (path.startsWith("/shop/profile")) res.locals.currentPage = "profile";
  else if (path.startsWith("/shop/my-orders")) res.locals.currentPage = "my-orders";
  else if (path.startsWith("/shop/settings") || path.startsWith("/shop/change-password")) res.locals.currentPage = "shop-settings";
  else if (path.startsWith("/products")) res.locals.currentPage = "products";
  else if (path.startsWith("/admin/orders")) res.locals.currentPage = "admin-orders";
  else if (path.startsWith("/admin/settings")) res.locals.currentPage = "settings";
  else if (path.startsWith("/admin/customers")) res.locals.currentPage = "admin-customers";
  else if (path.startsWith("/admin/add-employee")) res.locals.currentPage = "add-employee";

  next();
});

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.user.role !== "admin") {
    req.session.error = "admin_access";
    return res.redirect("/");
  }
  next();
}

const upload = require("./middleware/upload");

// Shop - public e-commerce routes (must be before auth-required routes)
app.use("/shop", require("./routes/shopRoutes"));

app.use("/", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));

// Homepage: landing page for guests, dashboard for logged-in
app.get("/", async (req, res, next) => {
  if (!req.session.user) {
    const Setting = require("./models/settingSchema");
    const whatsappPhone = await Setting.get("whatsappPhone", "963934034810");
    return res.render("home", { whatsappPhone });
  }
  // Logged-in users see the main dashboard
  const dashboard = require("./controllers/adminController").getDashboard;
  return dashboard(req, res, next);
});

app.use("/products", requireAuth, require("./routes/productRoutes")(upload));

// Admin
app.get("/dashboard", requireAuth, require("./controllers/adminController").getDashboard);
app.get("/admin/settings", requireAuth, require("./controllers/adminController").getSettings);
app.post("/admin/settings", requireAuth, require("./controllers/adminController").saveSettings);
app.get("/admin/customers", requireAuth, require("./controllers/adminController").getCustomers);
app.get("/admin/customers/:id", requireAuth, require("./controllers/adminController").getCustomer);
app.get("/admin/customers/:id/edit", requireAuth, requireAdmin, require("./controllers/adminController").getEditCustomer);
app.post("/admin/customers/:id/edit", requireAuth, requireAdmin, require("./controllers/adminController").updateCustomer);
app.post("/admin/customers/:id/toggle-status", requireAuth, requireAdmin, require("./controllers/adminController").toggleCustomerStatus);
app.post("/admin/customers/:id/delete", requireAuth, requireAdmin, require("./controllers/adminController").deleteCustomer);
app.post("/upload-profile-image", requireAuth, upload.single("image"), require("./controllers/adminController").uploadProfileImage);
app.get("/admin/add-employee", requireAuth, requireAdmin, require("./controllers/adminController").getAddEmployee);
app.post("/admin/add-employee", requireAuth, requireAdmin, require("./controllers/adminController").createEmployee);
app.get("/admin/change-password", requireAuth, require("./controllers/adminController").getChangePassword);
app.post("/admin/change-password", requireAuth, require("./controllers/adminController").changePassword);
app.get("/admin/profile", requireAuth, require("./controllers/adminController").getProfile);
app.post("/admin/profile", requireAuth, upload.single("image"), require("./controllers/adminController").updateProfile);
app.get("/admin/users", requireAuth, requireAdmin, require("./controllers/adminController").getUsers);
app.post("/admin/users/:id/toggle-role", requireAuth, requireAdmin, require("./controllers/adminController").toggleRole);
app.post("/admin/users/:id/delete", requireAuth, requireAdmin, require("./controllers/adminController").deleteUser);
app.get("/admin/activity", requireAuth, requireAdmin, require("./controllers/adminController").getActivity);
app.get("/admin/orders", requireAuth, require("./controllers/adminController").getOrders);
app.post("/admin/orders/:id/status", requireAuth, require("./controllers/adminController").updateOrderStatus);
app.get("/admin/payment-settings", requireAuth, require("./controllers/adminController").getPaymentSettings);
app.post("/admin/payment-settings", requireAuth, require("./controllers/adminController").savePaymentSettings);

// Export
app.get("/export/people", requireAuth, require("./controllers/exportController").peopleCSV);
app.get("/export/products", requireAuth, require("./controllers/exportController").productsCSV);

app.use((req, res) => { res.status(404).render("404"); });
app.use((err, req, res, next) => { console.error(err); res.status(500).render("500"); });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    const whatsapp = require("./services/whatsapp");
    if (process.env.ADMIN_PHONE) whatsapp.init();
    app.listen(port, () => { console.log(`🚀 Server running at: http://localhost:${port}/`); });
  })
  .catch((err) => { console.error('❌ MongoDB connection error:', err); });
