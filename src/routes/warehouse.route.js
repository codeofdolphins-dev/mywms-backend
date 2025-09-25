import { Router } from "express";
import { addWarehouse, allWarehouse, deleteWarehouse, editWarehouse } from "../controllers/warehouse.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(defineUserScope, defineDbObject, verifyJWT);
router.route("/all").get(verifyPermission("warehouse:read"), allWarehouse);     // optional ?id=
router.route("/delete/:id").get(verifyPermission("warehouse:delete"), deleteWarehouse);

router.use(upload.single("profile_image"), defineUserScope, defineDbObject, verifyJWT);
router.route("/add").post(verifyPermission("warehouse:create"), addWarehouse);
router.route("/edit").post(verifyPermission("warehouse:update"), editWarehouse);


export default router;