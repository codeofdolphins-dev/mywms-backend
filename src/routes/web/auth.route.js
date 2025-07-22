import { Router } from "express";
import { loginForm, loginSubmit, registerForm, registerSubmit } from "../../controllers/web/auth.controller.js";
import { upload } from "../../middlewares/multer.middleware.js"

const router = Router();

router.route("/login").get(loginForm).post(upload.none(), loginSubmit);
router.route("/register").get(registerForm).post(upload.none(), registerSubmit);

export default router;
