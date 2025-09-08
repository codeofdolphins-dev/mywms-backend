import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { forgetPassword, login, logout, register_company, request_otp, resetPassword, verify_otp } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";

const router = Router();

router.route("/login").post(defineUserScope, defineDbObject, login);

router.use(defineDbObject);
router.route("/register-company").post(upload.single("image"), register_company);
router.route("/request-otp").post(request_otp);
router.route("/verify-otp").post(verify_otp);
router.route("/forget-password").post(forgetPassword);

router.route("/logout").get(verifyJWT, logout);
router.route("/reset-password").post(verifyJWT, resetPassword);


export default router;