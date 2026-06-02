const router = require("express").Router();
const controller = require("../controllers/authController");
const { loginRules, customerLoginRules, registerRules, handleValidation } = require("../middleware/validation");
const { authLimiter } = require("../middleware/security");

router.get("/login", controller.getLogin);
router.post("/login", authLimiter, customerLoginRules, handleValidation, controller.customerLogin);
router.post("/admin-login", authLimiter, loginRules, handleValidation, controller.login);
router.post("/customer-register", authLimiter, registerRules, handleValidation, controller.customerRegister);
router.get("/guest-login", controller.guestLogin);
router.get("/logout", controller.logout);

module.exports = router;