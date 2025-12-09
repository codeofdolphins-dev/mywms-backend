import { Router } from "express";
import { allEmployeeList, currentUser, delete_employee, updateEmployeeDetails } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router()

router.route("/update-employee-details").put(upload.single("image"), defineUserScope, defineDbObject, verifyPermission("employee:update"), updateEmployeeDetails);

router.use(defineUserScope, defineDbObject, verifyJWT);

router.route("/current-user").get(currentUser);
router.route("/employee-list").get(verifyPermission("employee:read"), allEmployeeList); // optional ?id= &email=
router.route("/delete-employee").delete(verifyJWT, verifyPermission("employee:delete"), delete_employee);

export default router;