import { Router } from "express";
import { allReceiveRequisitionList, allRequisitionList, createRequisition, deleteRequisition, getCreateRequisitionContext, updateRequisition, updateRequisitionItems } from "../controllers/requisition.controller.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("requisition:read"), allRequisitionList);
router.route("/receive-list").get(verifyPermission("receive-requisition:read"), allReceiveRequisitionList);

router.route("/allow-node").get(getCreateRequisitionContext);

router.route("/create").post(verifyPermission("requisition:create"), createRequisition);
router.route("/delete/:id").delete(verifyPermission("requisition:delete"), deleteRequisition);
router.route("/update").put(verifyPermission("requisition:update"), updateRequisition);
router.route("/update-item").put(verifyPermission("requisition-item:update"), updateRequisitionItems);

export default router;