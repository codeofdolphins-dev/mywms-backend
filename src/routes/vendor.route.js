import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js"
import { allVendorList } from "../controllers/vendor.controller.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { allVendorCategoryList, createVendorCategory, deleteVendorCategory, updateVendorCategoryDetails } from "../controllers/vendorCategory.controller.js";

const router = Router();

router.use(defineUserScope, defineDbObject, verifyJWT);

router.route("/list").get(verifyPermission("vendor:read"), allVendorList);

// router.route("/update").put(verifyPermission("vendor:update"), updateSupplierDetails);
// router.route("/delete/:id").delete(verifyPermission("vendor:delete"), deleteSupplier);


router.route("/category/list").get(verifyPermission("vendor-category:read"), allVendorCategoryList);
router.route("/category/create").post(verifyPermission("vendor-category:create"), createVendorCategory);
router.route("/category/update").put(verifyPermission("vendor-category:update"), updateVendorCategoryDetails);
router.route("/category/delete/:id").delete(verifyPermission("vendor-category:delete"), deleteVendorCategory);

export default router;