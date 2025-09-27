import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { deleteVendor, registerVendor, updateVendorBankDetails, updateVendorDetails, vendorList } from "../controllers/vendor.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("vendor:read"), vendorList);      // optional ?id= &email=
router.route("/delete").get(verifyPermission("vendor:delete"), deleteVendor);

router.route("/create").post(verifyPermission("vendor:create"), registerVendor);
router.route("/update-vendor").put(verifyPermission("vendor:update"), updateVendorDetails);
router.route("/update-bank").put(verifyPermission("vendor-bank:update"), updateVendorBankDetails);


export default router;