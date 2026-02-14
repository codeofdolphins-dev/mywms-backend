import { Router } from "express";
import requisitionReport from "../routes/requisition.report.route.js";

const router = Router();

router.use("/requisition", requisitionReport);


export default router;