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

function requireCustomer(req, res, next) {
  if (!req.session.customer) {
    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    return res.redirect("/shop/login");
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireCustomer };