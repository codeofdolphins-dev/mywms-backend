import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createProductionOrder, productionOrderItemDetails, productionOrderList } from "../controllers/productionOrder.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("productionOrder:read"), productionOrderList);
router.route("/:pro_no").get(verifyPermission("productionOrder:read"), productionOrderItemDetails);
router.route("/create").post(verifyPermission("productionOrder:create"), createProductionOrder);
// router.route("/dispatch").put(verifyPermission("transferOrder:update"), confirmAllocation);


export default router;