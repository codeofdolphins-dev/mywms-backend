import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { acceptProductionReceipt, createProductionReceipt, productionReceiptList } from "../controllers/productionReceipt.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("productionReceipt:read"), productionReceiptList);
router.route("/create").post(verifyPermission("productionReceipt:create"), createProductionReceipt);
router.route("/accept").put(verifyPermission("productionReceipt:update"), acceptProductionReceipt);


export default router;