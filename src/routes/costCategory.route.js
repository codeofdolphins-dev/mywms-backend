import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { costCategoryList, createCostCategory, deleteCostCategory, updateCostCategory } from "../controllers/costCategory.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("costHead:read"), costCategoryList);
router.route("/delete/:id").delete(verifyPermission("costHead:delete"), deleteCostCategory);

router.route("/create").post(verifyPermission("costHead:create"), createCostCategory);
router.route("/update").put(verifyPermission("costHead:update"), updateCostCategory);

export default router;