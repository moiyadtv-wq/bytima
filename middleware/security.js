const rateLimit = require("express-rate-limit");
const Tokens = require("csrf");

const tokens = new Tokens();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const SKIP_CSRF = ["/login", "/admin-login", "/customer-register", "/guest-login", "/logout"];

function shouldSkipCSRF(path) {
  if (SKIP_CSRF.includes(path)) return true;
  if (path.startsWith("/products/add") || path.startsWith("/products/edit")) return true;
  if (path === "/admin/profile" || path === "/shop/profile" || path === "/upload-profile-image") return true;
  return false;
}

async function csrfProtect(req, res, next) {
  try {
    if (!req.session) return next();
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = await tokens.secret();
    }
    res.locals.csrfToken = tokens.create(req.session.csrfSecret);

    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method) && !shouldSkipCSRF(req.path)) {
      const token = req.body?._csrf || req.headers["x-csrf-token"];
      if (!token || !tokens.verify(req.session.csrfSecret, token)) {
        if (req.xhr || req.headers.accept?.includes("json")) {
          return res.status(403).json({ error: "Invalid or missing CSRF token" });
        }
        req.session.error = "csrf_error";
        const back = req.get("Referrer") || "/";
        return res.redirect(back);
      }
    }
    next();
  } catch (err) {
    console.error("CSRF error:", err);
    next(err);
  }
}

module.exports = { authLimiter, apiLimiter, checkoutLimiter, generalLimiter, csrfProtect };