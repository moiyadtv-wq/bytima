const { body, validationResult } = require("express-validator");

const loginRules = [
  body("email").exists().withMessage("required_fields").bail().isEmail().normalizeEmail().withMessage("valid_email_required"),
  body("password").exists().withMessage("password_required").bail().notEmpty().withMessage("password_required"),
];

const customerLoginRules = [
  body("login").trim().notEmpty().withMessage("login_required"),
  body("password").exists().withMessage("password_required").bail().notEmpty().withMessage("password_required"),
];

const registerRules = [
  body("firstName").trim().notEmpty().withMessage("required_fields"),
  body("lastName").trim().notEmpty().withMessage("required_fields"),
  body("email").exists().withMessage("required_fields").bail().isEmail().normalizeEmail().withMessage("valid_email_required"),
  body("phone").trim().notEmpty().withMessage("required_fields"),
  body("password").exists().withMessage("required_fields").bail().isLength({ min: 6 }).withMessage("password_too_short"),
  body("country").trim().notEmpty().withMessage("required_fields"),
];

const checkoutRules = [
  body("name").trim().notEmpty().withMessage("required_fields"),
  body("phone").trim().notEmpty().withMessage("required_fields"),
  body("governorate").trim().notEmpty().withMessage("required_fields"),
  body("region").trim().notEmpty().withMessage("required_fields"),
  body("detailedAddress").trim().notEmpty().withMessage("required_fields"),
  body("paymentMethod").isIn(["cod", "shamCash"]).withMessage("required_fields"),
];

const productRules = [
  body("name").trim().notEmpty().withMessage("required_fields"),
  body("price").exists().withMessage("required_fields").bail().isFloat({ min: 0 }).withMessage("required_fields"),
];

const changePasswordRules = [
  body("currentPassword").exists().withMessage("required_fields").bail().notEmpty().withMessage("required_fields"),
  body("newPassword").exists().withMessage("required_fields").bail().isLength({ min: 6 }).withMessage("password_too_short"),
  body("confirmPassword").custom((val, { req }) => {
    if (val !== req.body.newPassword) throw new Error("passwords_dont_match");
    return true;
  }),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.status(422).json({ error: first.msg });
    }
    req.session.error = first.msg;
    const back = req.get("Referrer") || "/login";
    return res.redirect(back);
  }
  next();
}

module.exports = { loginRules, customerLoginRules, registerRules, checkoutRules, productRules, changePasswordRules, handleValidation };