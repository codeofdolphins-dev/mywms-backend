import { Router } from "express";
import { deleteSuperAdmin, superAdminCreated, superAdminLogin, superAdminLogout } from "../../../controllers/api/global/superAdmin.controller.js";
import { verifyJWT } from "../../../middlewares/auth.middleware.js";

const router = Router();


router.route("/logout").get(verifyJWT, superAdminLogout);
router.route("/delete").get(verifyJWT, deleteSuperAdmin);
router.route("/create").post(superAdminCreated);
router.route("/login").post(superAdminLogin);


export default router;