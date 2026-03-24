import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allSalesOrderList, salesOrderItemDetails } from "../controllers/salesOrder.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("salesOrder:read"), allSalesOrderList);
router.route("/item-details").get(verifyPermission("salesOrder:read"), salesOrderItemDetails);

export default router;
