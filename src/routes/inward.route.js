import { Router } from "express";
import { createInward, deleteInward, getInward, updateInward, updateInwardItems } from "../controllers/inward.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all").get(verifyPermission("inward:read"), getInward);  // optional ?id= &page= &limit=
router.route("/create").post(verifyPermission("inward:create"), createInward);
router.route("/delete/:id").delete(verifyPermission("inward:delete"), deleteInward);
router.route("/update").put(verifyPermission("inward:update"), updateInward);
router.route("/update-item").put(verifyPermission("inward-item:update"), updateInwardItems);

export default router;