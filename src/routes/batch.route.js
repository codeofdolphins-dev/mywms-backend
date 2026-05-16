import { Router } from "express";
import { bulkOpeningStockInsertion } from "../controllers/batch.controller.js";
import { uploadMemory } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/bulk-create").post(uploadMemory.single("file"), verifyJWT, bulkOpeningStockInsertion);



export default router