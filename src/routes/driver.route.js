import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addDriver, allDriverList, deleteDriver, editDriver, myDriverList } from "../controllers/driver.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-driver").get(verifyPermission("driver:read"), allDriverList);   // optional ?id='' & license_no=''
router.route("/owned-driver").get(verifyPermission("driver:read"), myDriverList);
router.route("/delete/:id").delete(verifyPermission("driver:delete"), deleteDriver);

router.route("/add").post(verifyPermission("driver:create"), addDriver);
router.route("/edit").put(verifyPermission("driver:update"), editDriver);


export default router;