import { Router } from "express";
import { loginForm, loginSubmit, logOut, registerForm, registerSubmit } from "../../controllers/web/auth.controller.js";
import { upload } from "../../middlewares/multer.middleware.js"
import { companyLoginSubmit, companyRegisterForm, companyRegisterSubmit } from "../../controllers/web/company.controller.js";

const router = Router();

router.route("/login").get(loginForm).post(upload.none(), loginSubmit);
router.route("/userRegister").get(registerForm).post(upload.none(), registerSubmit);
router.route("/logout").get(logOut);


router.route("/companyRegister").get(companyRegisterForm).post(upload.single("image"), companyRegisterSubmit);
router.route("/companyLogin").post(upload.none(), companyLoginSubmit);

export default router;