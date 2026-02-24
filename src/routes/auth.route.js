import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { forgetPassword, login, logout, register_company, registeredUserWithNodes, registerVendor, request_otp, resetPassword, updateUser, verify_otp } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { registerNewTenant } from "../middlewares/tenantRegister.middleware.js";

const router = Router();

// register company - POSTMAN ONLY
router.route("/register-company").post(upload.none(), defineUserScope, defineDbObject, register_company);

// register tenant company
router.route("/register-new-company").post(registerNewTenant, register_company);

// register user
router.route("/register-user").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("user: create"), registeredUserWithNodes);

// register vendor
router.route("/register-vendor").post(defineUserScope, defineDbObject, verifyJWT, verifyPermission("user: create"), registerVendor);



router.route("/update-user").put(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("user: update"), updateUser);


router.use(upload.none(), defineUserScope, defineDbObject);
router.route("/login").post(login);
router.route("/request-otp").post(request_otp);
router.route("/verify-otp").post(verify_otp);
router.route("/forget-password").post(forgetPassword);
router.route("/logout").get(verifyJWT, logout);
router.route("/reset-password").post(verifyJWT, resetPassword);

export default router;