const controller = require("../controllers/productController");
const { productRules, handleValidation } = require("../middleware/validation");
const { csrfProtect } = require("../middleware/security");

module.exports = (upload) => {
  const router = require("express").Router();
  router.get("/", controller.getAll);
  router.get("/add", controller.getAddForm);
  router.post("/add", upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 10 }]), csrfProtect, productRules, handleValidation, controller.create);
  router.get("/view/:id", controller.getById);
  router.get("/edit/:id", controller.getEditForm);
  router.post("/edit/:id", upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 10 }]), csrfProtect, productRules, handleValidation, controller.update);
  router.post("/delete/:id", controller.delete);
  return router;
};