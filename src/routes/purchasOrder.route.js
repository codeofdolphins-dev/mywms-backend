import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allPurchasOrderList, createPurchasOrder, deletePurchasOrder, updatePurchasOrder, updatePurchasOrderItem } from "../controllers/purchasOrder.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("purchaseOrder:read"), allPurchasOrderList); // optional ?id= &page= &limit=

router.route("/create").post(verifyPermission("purchaseOrder:create"), createPurchasOrder);
router.route("/delete/:id").delete(verifyPermission("purchaseOrder:delete"), deletePurchasOrder);
router.route("/update").put(verifyPermission("purchaseOrder:update"), updatePurchasOrder);
router.route("/update-item").put(verifyPermission("purchaseOrder-item:update"), updatePurchasOrderItem); 

export default router;