import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { confirmAllocation, createTransferRequest, transferOrderItemDetails, transferOrderList } from "../controllers/transferRequest.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("transferOrder:read"), transferOrderList);
router.route("/:to_no").get(verifyPermission("transferOrder:read"), transferOrderItemDetails);
router.route("/create").post(verifyPermission("transferOrder:create"), createTransferRequest);
router.route("/dispatch").put(verifyPermission("transferOrder:update"), confirmAllocation);


export default router;