import { Router } from "express";
import { allReceiveRequisitionList, allRequisitionList, createInternalRequisition, createOpenForumRequisition, createTradingRequisition, deleteRequisition, getCreateRequisitionContext, updateRequisition, updateRequisitionItems } from "../controllers/requisition.controller.js";
import { assignTradingRequisitionFgStore, deleteTradingRequisition, getTradingRequisitionDetails, receiveTradingRequisitionList, sentTradingRequisitionList, updateTradingRequisition, updateTradingRequisitionStatus } from "../controllers/central/interCompReq.controller.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/allow-node").get(getCreateRequisitionContext);


router.route("/list").get(verifyPermission("requisition:read"), allRequisitionList);
router.route("/receive-list").get(verifyPermission("receive-requisition:read"), allReceiveRequisitionList);
router.route("/create/internal").post(verifyPermission("requisition:create"), createInternalRequisition);
router.route("/update").put(verifyPermission("requisition:update"), updateRequisition);
router.route("/delete/:id").delete(verifyPermission("requisition:delete"), deleteRequisition);

router.route("/create/open-forum").post(verifyPermission("requisition-openForum:create"), createOpenForumRequisition);
router.route("/create/trading").post(verifyPermission("requisition-trading:create"), createTradingRequisition);

/** trading (intercompany) requisition */
router.route("/trading/list").get(verifyPermission("requisition-trading:read"), sentTradingRequisitionList);
router.route("/trading/receive-list").get(verifyPermission("requisition-trading:read"), receiveTradingRequisitionList);
router.route("/trading/assign-fg").post(verifyPermission("requisition-trading:update"), assignTradingRequisitionFgStore);
router.route("/trading/update").put(verifyPermission("requisition-trading:update"), updateTradingRequisition);
router.route("/trading/update-status").put(verifyPermission("requisition-trading:update"), updateTradingRequisitionStatus);
router.route("/trading/delete/:id").delete(verifyPermission("requisition-trading:delete"), deleteTradingRequisition);
router.route("/trading/:id").get(verifyPermission("requisition-trading:read"), getTradingRequisitionDetails);

router.route("/update-item").put(verifyPermission("requisition-item:update"), updateRequisitionItems);

export default router;