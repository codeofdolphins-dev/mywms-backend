import { Router } from "express";
import { bulkOpeningStockInsertion, getBatch } from "../controllers/batch.controller.js";
import { uploadMemory } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/bulk-create").post(uploadMemory.single("file"), verifyJWT, bulkOpeningStockInsertion);
router.route("/get-by-product/:product_id").get(verifyJWT, getBatch);



export default router