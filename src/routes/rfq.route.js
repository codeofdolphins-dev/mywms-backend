import { Router } from "express";
import { allRfqList } from "../controllers/rfq.controller.js";
import { allRfqQuotationList, createRfqQuotation, deleteRfqQuotation } from "../controllers/rfqQuotation.controller.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

// public route
router.route("/list").get(allRfqList);

// private routes
router.use(defineUserScope, defineDbObject, verifyJWT);


/** RFQ quotation */
// router.route("/quotaion/list").get();
router.route("/quotation/list").get(verifyPermission("rfq-quotation:create"), allRfqQuotationList);
router.route("/quotation/create").post(verifyPermission("rfq-quotation:create"), createRfqQuotation);
router.route("/quotation/delete/:id").delete(verifyPermission("rfq-quotation:create"), deleteRfqQuotation);




export default router;