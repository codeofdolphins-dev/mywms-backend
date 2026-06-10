import { Router } from "express";
import { generateProformaInvoicePDF } from "../controller/proformaInvoice.controller.js";
import { generateRequisitionPDF } from "../controller/requisition.controller.js";
import { generateBpoAgreementPDF } from "../controller/bpoAgreement.controller.js";

const router = Router();

router.post("/requisition", generateRequisitionPDF);
router.post("/proforma-invoice", generateProformaInvoicePDF);
router.post("/bpo-agreement", generateBpoAgreementPDF);


export default router;