import { Router } from "express";
import pdfApi from "../../reports/routes/index.route.js"
import excelApi from "../excel/routes/index.route.js"

const router = Router();

router.use("/pdf", pdfApi);
router.use("/excel", excelApi);

export default router;