const { body, validationResult } = require("express-validator");

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("valid_email_required"),
  body("password").isLength({ min: 1 }).withMessage("password_required"),
];

const customerLoginRules = [
  body("login").trim().notEmpty().withMessage("login_required"),
  body("password").isLength({ min: 1 }).withMessage("password_required"),
];

const registerRules = [
  body("firstName").trim().isLength({ min: 1 }).withMessage("required_fields"),
  body("lastName").trim().isLength({ min: 1 }).withMessage("required_fields"),
  body("email").isEmail().normalizeEmail().withMessage("valid_email_required"),
  body("phone").trim().isLength({ min: 7 }).withMessage("required_fields"),
  body("password").isLength({ min: 6 }).withMessage("password_too_short"),
  body("country").trim().isLength({ min: 1 }).withMessage("required_fields"),
];

const checkoutRules = [
  body("name").trim().isLength({ min: 1 }).withMessage("required_fields"),
  body("phone").trim().isLength({ min: 7 }).withMessage("required_fields"),
  body("governorate").trim().isLength({ min: 1 }).withMessage("required_fields"),
  body("region").trim().isLength({ min: 1 }).withMessage("required_fields"),
  body("detailedAddress").trim().isLength({ min: 1 }).withMessage("required_fields"),
  body("paymentMethod").isIn(["cod", "shamCash"]).withMessage("required_fields"),
];

const productRules = [
  body("name").trim().isLength({ min: 1 }).withMessage("required_fields"),
  body("price").isFloat({ min: 0 }).withMessage("required_fields"),
];

const changePasswordRules = [
  body("currentPassword").isLength({ min: 1 }).withMessage("required_fields"),
  body("newPassword").isLength({ min: 6 }).withMessage("password_too_short"),
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
    return res.redirect("back");
  }
  next();
}

module.exports = { loginRules, customerLoginRules, registerRules, checkoutRules, productRules, changePasswordRules, handleValidation };