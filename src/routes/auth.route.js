import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { forgetPassword, login, logout, register_company, request_otp, resetPassword, user_registration, verify_otp } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.route("/register-company").post(upload.single("image"), defineUserScope, defineDbObject, register_company);
router.route("/user-register").post(upload.single("profile_image"), defineUserScope, defineDbObject, verifyJWT, user_registration);


// router.route("/register-employee").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("employee:create"), register_employee);
// router.route("/register-supplier").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("supplier:create"), register_supplier);
// router.route("/register-distributor").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("distributor:create"), register_distributor);
// router.route("/register-warehouse").post(upload.single("profile_image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("warehouse:create"), register_warehouse);


router.use(defineUserScope, defineDbObject);
router.route("/login").post(login);
router.route("/request-otp").post(request_otp);
router.route("/verify-otp").post(verify_otp);
router.route("/forget-password").post(forgetPassword);
router.route("/logout").get(verifyJWT, logout);
router.route("/reset-password").post(verifyJWT, resetPassword);

export default router;