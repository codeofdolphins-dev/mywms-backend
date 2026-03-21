import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createIndent } from "../controllers/central/indent.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/create").post(verifyPermission("indent:create"), createIndent);


export default router;