import { Router } from "express";
import { allReceiveRequisitionList, allRequisitionList, createExternalRequisition, createInternalRequisition, deleteRequisition, getCreateRequisitionContext, updateRequisition, updateRequisitionItems } from "../controllers/requisition.controller.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/allow-node").get(getCreateRequisitionContext);


router.route("/list").get(verifyPermission("requisition:read"), allRequisitionList);
router.route("/receive-list").get(verifyPermission("receive-requisition:read"), allReceiveRequisitionList);
router.route("/create-internal").post(verifyPermission("requisition:create"), createInternalRequisition);
router.route("/update").put(verifyPermission("requisition:update"), updateRequisition);
router.route("/delete/:id").delete(verifyPermission("requisition:delete"), deleteRequisition);

router.route("/create-external").post(verifyPermission("requisition-external:create"), createExternalRequisition);

router.route("/update-item").put(verifyPermission("requisition-item:update"), updateRequisitionItems);

export default router;