import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { forgetPassword, login, logout, register_company, registeredUserWithNodes, request_otp, resetPassword, updateUser, verify_otp } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.route("/register-company").post(upload.single("image"), defineUserScope, defineDbObject, register_company);

router.route("/register-user").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("user: create"), updateUser);

router.route("/update-user").put(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("user: update"), registeredUserWithNodes);


router.use(upload.none(), defineUserScope, defineDbObject);
router.route("/login").post(login);
router.route("/request-otp").post(request_otp);
router.route("/verify-otp").post(verify_otp);
router.route("/forget-password").post(forgetPassword);
router.route("/logout").get(verifyJWT, logout);
router.route("/reset-password").post(verifyJWT, resetPassword);

export default router;