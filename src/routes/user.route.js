import { Router } from "express";
import { allEmployeeList, currentUser, updateCompanyDetails, updateEmployeeDetails } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router()


router.route("/update-company-details").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("company:update"), updateCompanyDetails);

router.route("/update-employee-details").get(upload.single("image"), defineUserScope, defineDbObject, verifyPermission("employee:update"), updateEmployeeDetails);

router.use(defineUserScope, defineDbObject, verifyJWT);
router.route("/current-user").get(currentUser);
router.route("/employee-list").get(verifyPermission("employee:read"), allEmployeeList);        // optional ?id= &email=

export default router;