import { Router } from "express";
import { createInward } from "../controllers/inward.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create").post(verifyPermission("inward:create"), createInward);


export default router;