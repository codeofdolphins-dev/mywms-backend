import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createIndent, updateStatusViaIndent } from "../controllers/central/indent.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/create").post(verifyPermission("indent:create"), createIndent);
router.route("/update-status").put(verifyPermission("indent:update"), updateStatusViaIndent);


export default router;