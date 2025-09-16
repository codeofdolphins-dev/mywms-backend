import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { delete_employee, forgetPassword, login, logout, register_company, register_employee, request_otp, resetPassword, verify_otp } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.route("/register-company").post(upload.single("image"), defineUserScope, defineDbObject, register_company);
router.route("/register-employee").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("employee:create"), register_employee);


router.use(defineUserScope, defineDbObject);
router.route("/login").post(login);
router.route("/request-otp").post(request_otp);
router.route("/verify-otp").post(verify_otp);
router.route("/forget-password").post(forgetPassword);
router.route("/logout").get(verifyJWT, logout);
router.route("/reset-password").post(verifyJWT, resetPassword);

router.route("/delete-employee").post(verifyJWT, verifyPermission("employee:delete"), delete_employee);


export default router;