import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allQuotation, allReceiveRequisitionList, createQuotation, deleteQuotation, updateQuotationDetails, updateQuotationItems } from "../controllers/quotation.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("quotation:read"), allQuotation);
router.route("/receive-requisition-list").get(verifyPermission("quotation:read"), allReceiveRequisitionList);

router.route("/create").post(verifyPermission("quotation:create"), createQuotation);
router.route("/delete/:id").delete(verifyPermission("quotation:delete"), deleteQuotation);
router.route("/update").put(verifyPermission("quotation:update"), updateQuotationDetails);
router.route("/update-item").put(verifyPermission("quotation-item:update"), updateQuotationItems);


export default router;