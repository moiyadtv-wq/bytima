const router = require("express").Router();
const controller = require("../controllers/authController");
const { loginRules, customerLoginRules, registerRules, handleValidation } = require("../middleware/validation");

router.get("/login", controller.getLogin);
router.post("/login", customerLoginRules, handleValidation, controller.customerLogin);
router.post("/admin-login", loginRules, handleValidation, controller.login);
router.post("/customer-register", registerRules, handleValidation, controller.customerRegister);
router.get("/guest-login", controller.guestLogin);
router.get("/logout", controller.logout);

module.exports = router;