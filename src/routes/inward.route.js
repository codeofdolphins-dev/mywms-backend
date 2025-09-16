import { Router } from "express";
import { createInward, deleteInward, getInward } from "../controllers/inward.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("all-inward").get(verifyPermission("inward:read"), getInward);  // optional ?id=*
router.route("create").post(verifyPermission("inward:create"), createInward);
router.route("delete").post(verifyPermission("inward:delete"), deleteInward);

export default router;