import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createTransferRequest, transferOrderList } from "../controllers/transferRequest.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("transferOrder:read"), transferOrderList);
router.route("/create").post(verifyPermission("transferOrder:create"), createTransferRequest);


export default router;