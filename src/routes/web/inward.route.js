import { Router } from "express";
import { addItem, inwardFormView, inwardSubmit } from "../../controllers/web/inward.controller.js";
import { upload } from "../../middlewares/multer.middleware.js"
import { verifyPermission } from "../../middlewares/permission.middleware.js"

const router = Router();

router.route("/").get(inwardFormView);
router.route("/add-inward-items").post(verifyPermission("inward:create"), upload.none(), addItem);
router.route("/add-inward").post(verifyPermission("inward:create"), upload.none(), inwardSubmit);


export default router;