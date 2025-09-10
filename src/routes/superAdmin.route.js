import { Router } from "express";
import { register } from "../controllers/superAdmin.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);


router.route("/register").post(verifyPermission("tenant:create"), register);


export default router;