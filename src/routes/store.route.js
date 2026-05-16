import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js"
import { manufacturingUnitList, registerManufacturingUnit, manufacturingUnitCountByType, updateManufacturingUnit, deleteManufacturingUnit } from "../controllers/store.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("store:read"), manufacturingUnitList);
router.route("/count-by-type").get(manufacturingUnitCountByType);
router.route("/create").post(verifyPermission("store:create"), registerManufacturingUnit);
router.route("/update").put(verifyPermission("store:update"), updateManufacturingUnit);
router.route("/delete/:id").delete(verifyPermission("store:delete"), deleteManufacturingUnit);

export default router;