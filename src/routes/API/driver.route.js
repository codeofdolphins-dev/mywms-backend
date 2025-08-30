import { Router } from "express";
import { verifyPermission } from "../../middlewares/permission.middleware.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { addDriver, deleteDriver, driverList, editDriver } from "../../controllers/api/driver.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-driver").get(verifyPermission("driver:read"), driverList);
router.route("/delete-driver/:id").get(verifyPermission("driver:delete"), deleteDriver);
router.route("/add-driver").post(verifyPermission("driver:create"), addDriver);
router.route("/edit-driver").post(verifyPermission("driver:update"), editDriver);



export default router;