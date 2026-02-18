import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js"
import { deleteSupplier, registerSupplier, supplierList, updateSupplierDetails } from "../controllers/supplier.controller.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("supplier:read"), supplierList);
router.route("/create").post(verifyPermission("supplier:create"), registerSupplier);
router.route("/update").put(verifyPermission("supplier:update"), updateSupplierDetails);
router.route("/delete/:id").delete(verifyPermission("supplier:delete"), deleteSupplier);

export default router;