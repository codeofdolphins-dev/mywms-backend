import { Router } from "express";
import { register } from "../controllers/superAdmin.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/register").post(register);


export default router;