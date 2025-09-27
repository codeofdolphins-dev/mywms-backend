import { Router } from "express";
import { allRequisitionList, createRequisition, deleteRequisition, updateRequisition, updateRequisitionItems } from "../controllers/requisition.controller.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-list").get(verifyPermission("requisition:read"), allRequisitionList); // optional ?id= &page= &limit=

router.route("/create").post(verifyPermission("requisition:create"), createRequisition);
router.route("/delete/:id").delete(verifyPermission("requisition:delete"), deleteRequisition);
router.route("/update").put(verifyPermission("requisition:update"), updateRequisition);
router.route("/update-item").put(verifyPermission("requisition-item:update"), updateRequisitionItems);

export default router;