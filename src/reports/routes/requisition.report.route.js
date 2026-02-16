import { Router } from "express";
import { generateRequisitionPDF } from "../requisition/requisition.controller.js";

const router = Router();


router.post("/details", generateRequisitionPDF);

router.get("/", (req, res) => res.send("pdf"));


export default router;