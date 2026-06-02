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

async function csrfProtect(req, res, next) {
  if (req.session) {
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = await tokens.secret();
    }
    res.locals.csrfToken = tokens.create(req.session.csrfSecret);

    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method) && !SKIP_CSRF.includes(req.path)) {
      const token = req.body?._csrf || req.headers["x-csrf-token"];
      if (!tokens.verify(req.session.csrfSecret, token)) {
        if (req.xhr || req.headers.accept?.includes("json")) {
          return res.status(403).json({ error: "Invalid or missing CSRF token" });
        }
        req.session.error = "csrf_error";
        const back = req.get("Referrer") || "/";
        return res.redirect(back);
      }
    }
  }
  next();
}

module.exports = { authLimiter, apiLimiter, checkoutLimiter, generalLimiter, csrfProtect };