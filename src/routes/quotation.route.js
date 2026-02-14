import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allQuotation, allReceiveQuotationList, createQuotation, deleteQuotation, rejectQuotation, updateQuotationDetails, updateQuotationItems } from "../controllers/quotation.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("quotation:read"), allQuotation);
router.route("/receive-list").get(verifyPermission("receive-quotation:read"), allReceiveQuotationList);

router.route("/create").post(verifyPermission("quotation:create"), createQuotation);

router.route("/delete/:id").delete(verifyPermission("quotation:delete"), deleteQuotation);
router.route("/reject/:id").put(verifyPermission("quotation:update"), rejectQuotation);

router.route("/update").put(verifyPermission("quotation:update"), updateQuotationDetails);
router.route("/update-item").put(verifyPermission("quotation-item:update"), updateQuotationItems);


export default router;