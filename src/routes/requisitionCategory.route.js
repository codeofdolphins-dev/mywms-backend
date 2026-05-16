import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allRequisitionCategoryList, createRequisitionCategory, deleteRequisitionCategory, updateRequisitionCategory } from "../controllers/requisitionCategory.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(allRequisitionCategoryList);
router.route("/create").post(createRequisitionCategory);
router.route("/update").put(updateRequisitionCategory);
router.route("/delete/:id").delete(deleteRequisitionCategory);

export default router;