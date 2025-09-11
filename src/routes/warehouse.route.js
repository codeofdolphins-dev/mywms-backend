import { Router } from "express";
import { addWarehouse, allWarehouse, deleteWarehouse, editWarehouse } from "../controllers/warehouse.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all").get(verifyPermission("warehouse:read"), allWarehouse);     // optional ?id=
router.route("/delete/:id").get(verifyPermission("warehouse:delete"), deleteWarehouse);
router.route("/add").post(verifyPermission("warehouse:create"), addWarehouse);
router.route("/edit").post(verifyPermission("warehouse:update"), editWarehouse);


export default router;