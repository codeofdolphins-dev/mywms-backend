import { Router } from "express";
import { register } from "../../controllers/api/superAdmin.controller.js"

const router = Router();

router.route("/register").post(register);


export default router;