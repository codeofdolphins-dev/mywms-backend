import { Router } from "express";
import { allRfqList } from "../controllers/rfq.controller.js";
import { allRfqQuotationList, createRfqQuotation, deleteRfqQuotation, getQuotationWithPaginatedItems, negotiateRfqQuotation, updateRfqQuotation } from "../controllers/rfqQuotation.controller.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createBlanketOrder } from "../controllers/blanketOrder.controller.js";

const router = Router();

// public route
router.route("/list").get(allRfqList);

// private routes
router.use(defineUserScope, defineDbObject, verifyJWT);



/** RFQ quotation */
// router.route("/quotaion/list").get();
router.route("/quotation/list").get(verifyPermission("rfq-quotation:list"), allRfqQuotationList);
router.route("/quotation-receive/list").get(verifyPermission("rfq-quotation:list"), getQuotationWithPaginatedItems);

router.route("/quotation/create").post(verifyPermission("rfq-quotation:create"), createRfqQuotation);
router.route("/quotation/negotiate").put(verifyPermission("rfq-quotation:update"), negotiateRfqQuotation);
router.route("/quotation/update").put(verifyPermission("rfq-quotation:update"), updateRfqQuotation);
router.route("/quotation/delete/:id").delete(verifyPermission("rfq-quotation:delete"), deleteRfqQuotation);



/** blanket-order */
router.route("/blanket-order/create").post(verifyPermission("rfq-quotation:create"), createBlanketOrder);




export default router;