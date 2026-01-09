import { Router } from "express";
import { all_company, allBusinessNodes, delete_company, registerBusinessNodePartner, registerBusinessNodeWarehouse, registerNewTenant, updateCompanyDetails } from "../controllers/superAdmin.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";

const router = Router();

router.route("/register-node-warehouse").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("company:create"), registerBusinessNodeWarehouse);
router.route("/register-node-partner").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("company:create"), registerBusinessNodePartner);

router.use(defineUserScope, defineDbObject, verifyJWT);

router.route("/business-nodes").get(verifyPermission("system-node:read"), allBusinessNodes);
router.route("/list").get(verifyPermission("company:read"), all_company);    // optional ?page= &limit= &email= &id=

router.route("/register-tenant").post(verifyPermission("company:create"), registerNewTenant);
router.route("/delete").post(verifyPermission("company:delete"), delete_company);
router.route("/update-company-details").put(upload.single("image"), verifyJWT, verifyPermission("company:update"), updateCompanyDetails);


export default router;