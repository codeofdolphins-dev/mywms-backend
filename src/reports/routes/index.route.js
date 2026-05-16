import { Router } from "express";
import requisitionReport from "../routes/requisition.report.route.js";
import proformaInvoiceReport from "../routes/proformaInvoice.report.route.js";

const router = Router();

router.use("/requisition", requisitionReport);
router.use("/proforma-invoice", proformaInvoiceReport);


export default router;