import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js"
import { deleteSupplier, registerSupplier, supplierList, updateSupplierDetails } from "../controllers/supplier.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";

const router = Router();

router.route("/create").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("supplier:create"), registerSupplier);
router.route("/update").put(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("supplier:update"), updateSupplierDetails);

router.use(defineUserScope, defineDbObject, verifyJWT);
router.route("/all").get(verifyPermission("supplier:read"), supplierList);
router.route("/delete/:id").delete(verifyPermission("supplier:delete"), deleteSupplier);


export default router;