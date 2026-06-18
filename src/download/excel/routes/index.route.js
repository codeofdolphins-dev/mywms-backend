import { Router } from "express";
import { sampleOpeningStock } from "../controller/sampleInventory.controller.js";
import { sampleProductUpload } from "../controller/sampleProduct.upload.controller.js";

const router = Router();

router.route("/inventory-opening-sample").post(sampleOpeningStock);
router.route("/product-upload-sample").post(sampleProductUpload);

export default router;