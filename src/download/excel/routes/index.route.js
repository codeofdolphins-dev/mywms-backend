import { Router } from "express";
import { sampleOpeningStock } from "../controller/sampleInventory.controller.js";
import { sampleProductUpload } from "../controller/sampleProduct.upload.controller.js";

const router = Router();

router.route("/inventory/sample-opening-stock").post(sampleOpeningStock);
router.route("/product/sample-upload").post(sampleProductUpload);

export default router;