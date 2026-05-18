import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createRecord, list } from "../controllers/directTransfer.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("directTransfer:read"), list);
router.route("/create").post(verifyPermission("directTransfer:create"), createRecord);


export default router;