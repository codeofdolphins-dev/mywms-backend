import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { allRequisitionCategoryList, createRequisitionCategory, deleteRequisitionCategory, updateRequisitionCategory } from "../controllers/requisitionCategory.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("requisitionCategory:read"), allRequisitionCategoryList);
router.route("/create").post(verifyPermission("requisitionCategory:create"), createRequisitionCategory);
router.route("/update").put(verifyPermission("requisitionCategory:update"), updateRequisitionCategory);
router.route("/delete/:id").delete(verifyPermission("requisitionCategory:delete"), deleteRequisitionCategory);

export default router;