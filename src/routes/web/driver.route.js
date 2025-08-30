import { Router } from "express";
import { addDriverForm, addDriverSubmit, deleteDriver, driverList, driverListAPI, editDriver, editDriverForm } from "../../controllers/web/driver.controller.js";
import auth_session from "../../middlewares/checkSession.web.middleware.js";
import { verifyPermission } from "../../middlewares/permission.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js"

const router = Router();

router.use(auth_session);

router.route("/").get(verifyPermission("driver:read"), driverList);
router.route("/addDriver").get(addDriverForm).post(verifyPermission("driver:create"), upload.none(), addDriverSubmit);
router.route("/editDriver").get(editDriverForm).post(verifyPermission("driver:update"), upload.none(), editDriver);
router.route("/deleteDriver").get(verifyPermission("driver:delete"), deleteDriver);

router.route("/api/driver-list").get(verifyPermission("driver:read"), driverListAPI);


export default router;