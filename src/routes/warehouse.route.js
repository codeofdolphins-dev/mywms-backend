import { Router } from "express";
import { allWarehouse, deleteWarehouse, editWarehouse } from "../controllers/warehouse.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.route("/edit").put(upload.single("profile_image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("warehouse:update"), editWarehouse);

router.use(defineUserScope, defineDbObject, verifyJWT);
router.route("/all").get(verifyPermission("warehouse:read"), allWarehouse);     // optional ?id=
router.route("/delete/:id").delete(verifyPermission("warehouse:delete"), deleteWarehouse);


export default router;