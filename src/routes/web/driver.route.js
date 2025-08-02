import { Router } from "express";
import { addDriverForm, addDriverSubmit, deleteDriver, driverList, editDriver, editDriverForm } from "../../controllers/web/driver.controller.js";
import auth_session from "../../middlewares/checkSession.web.middleware.js";
import { verifyPermission } from "../../middlewares/permission.middleware.js";

const router = Router();

// auth_session
// verifyPermission

router.route("/").get(verifyPermission("driver:read"), driverList);
router.route("/addDriver").get(addDriverForm).post(verifyPermission("driver:create"), addDriverSubmit);
router.route("/editDriver").get(editDriverForm).post(verifyPermission("driver:update"), editDriver);
router.route("/deleteDriver").get(verifyPermission("driver:delete"), deleteDriver);

export default router;