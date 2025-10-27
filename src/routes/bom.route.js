import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addItem, allBOMList, createBOM, deleteBOM, removeItem, updateBOM } from "../controllers/BOM.controller.js";

const router = Router();


router.use(verifyJWT);

router.route("/all").get(verifyPermission("bom:read"), allBOMList);  // optional ?id= &page= &limit=
router.route("/create").post(verifyPermission("bom:create"), createBOM);
router.route("/delete/:id").delete(verifyPermission("bom:delete"), deleteBOM);
router.route("/update").put(verifyPermission("bom:update"), updateBOM);
router.route("/add-item").put(verifyPermission("bom-item:add"), addItem);
router.route("/remove-item").delete(verifyPermission("bom-item:remove"), removeItem); // ?id=""&finished_product_id=""


export default router;