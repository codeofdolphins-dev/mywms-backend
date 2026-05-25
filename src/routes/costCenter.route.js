import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { costList, createCost, deleteCost, updateCost } from "../controllers/costCenter.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("costCenter:read"), costList);
router.route("/delete/:id").delete(verifyPermission("costCenter:delete"), deleteCost);

router.route("/create").post(verifyPermission("costCenter:create"), createCost);
router.route("/update").put(verifyPermission("costCenter:update"), updateCost);

export default router;
