import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { confirmAllocation, confirmTransferOrderReceived, createTransferRequest, transferOrderItemDetails, transferOrderList } from "../controllers/transferOrder.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("transferOrder:read"), transferOrderList);
router.route("/:to_no").get(verifyPermission("transferOrder:read"), transferOrderItemDetails);
router.route("/create").post(verifyPermission("transferOrder:create"), createTransferRequest);
router.route("/dispatch").put(verifyPermission("transferOrder:update"), confirmAllocation);
router.route("/receive").put(verifyPermission("transferOrder:update"), confirmTransferOrderReceived);


export default router;