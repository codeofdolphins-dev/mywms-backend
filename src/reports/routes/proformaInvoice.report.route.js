import { Router } from "express";
import { generateProformaInvoicePDF } from "../../download/pdf/controller/proformaInvoice.controller.js";

const router = Router();


router.post("/details", generateProformaInvoicePDF);

router.get("/", (req, res) => res.send("proforma-invoice pdf"));


export default router;
