import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allBOMList, createBOM } from "../controllers/bom.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("bom:read"), allBOMList);
router.route("/create").post(verifyPermission("bom:create"), createBOM);


// router.route("/delete/:id").delete(verifyPermission("bom:delete"), deleteBOM);
// router.route("/update").put(verifyPermission("bom:update"), updateBOM);
// router.route("/add-item").put(verifyPermission("bom-item:add"), addItem);
// router.route("/remove-item").delete(verifyPermission("bom-item:remove"), removeItem);


export default router;