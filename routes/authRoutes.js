const router = require("express").Router();
const controller = require("../controllers/authController");

router.get("/login", controller.getLogin);
router.post("/login", controller.customerLogin);
router.post("/admin-login", controller.login);
router.post("/customer-register", controller.customerRegister);
router.get("/guest-login", controller.guestLogin);
router.get("/logout", controller.logout);

module.exports = router;
