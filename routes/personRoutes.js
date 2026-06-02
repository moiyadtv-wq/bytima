const router = require("express").Router();
const controller = require("../controllers/personController");

module.exports = (upload, requireAdmin) => {
  router.get("/", controller.getPeople);
  router.get("/view/:id", controller.viewPerson);
  router.get("/edit/:id", requireAdmin, controller.getEditPerson);
  router.post("/edit/:id", requireAdmin, controller.editPerson);
  router.post("/delete/:id", requireAdmin, controller.deletePerson);
  router.get("/add", requireAdmin, controller.getAddEmployeeForm);
  router.post("/add", requireAdmin, controller.createEmployee);
  return router;
};
