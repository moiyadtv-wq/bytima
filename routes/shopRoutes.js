const router = require("express").Router();
const controller = require("../controllers/shopController");
const upload = require("../middleware/upload");

// Product catalog
router.get("/", controller.getCatalog);
router.get("/product/:id", controller.getProduct);
router.get("/about", (req, res) => res.render("shop/about"));
router.get("/settings", controller.getSettings);
router.get("/change-password", requireCustomer, controller.getChangePassword);
router.post("/change-password", requireCustomer, controller.changePassword);

// Cart (customer only)
function requireCustomer(req, res, next) {
  if (!req.session.customer) return res.redirect("/login");
  next();
}
router.get("/cart", requireCustomer, controller.getCart);
router.post("/cart/add/:id", requireCustomer, controller.addToCart);
router.post("/cart/update", requireCustomer, controller.updateCart);
router.post("/cart/remove", requireCustomer, controller.removeFromCart);
router.post("/cart/clear", requireCustomer, controller.clearCart);

// Profile (customer only)
router.get("/profile", requireCustomer, controller.getProfile);
router.post("/profile", requireCustomer, upload.single("image"), controller.updateProfile);

// Checkout / Orders (customer only)
router.get("/buy-now/:id", requireCustomer, controller.buyNow);
router.get("/checkout", requireCustomer, controller.getCheckout);
router.post("/checkout", requireCustomer, controller.placeOrder);
router.get("/my-orders", requireCustomer, controller.getMyOrders);
router.get("/orders/:id", controller.getOrder);

module.exports = router;
