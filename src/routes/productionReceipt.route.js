import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createProductionReceipt, productionReceiptList } from "../controllers/productionReceipt.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("productionReceipt:read"), productionReceiptList);
// router.route("/:pro_no").get(verifyPermission("productionOrder:read"), productionOrderItemDetails);
router.route("/create").post(verifyPermission("productionReceipt:create"), createProductionReceipt);
// router.route("/dispatch").put(verifyPermission("transferOrder:update"), confirmAllocation);


export default router;