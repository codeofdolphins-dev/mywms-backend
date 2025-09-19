import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { allCategoryList, createCategory, deleteCategory, updateCategory } from "../controllers/category.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-list").get(verifyPermission("category:read"), allCategoryList); // optional ?barcode= &page= &limit=
router.route("/delete/:id").get(verifyPermission("category:delete"), deleteCategory);

router.route("/create").post(verifyPermission("category:create"), createCategory);
router.route("/update").post(verifyPermission("category:update"), updateCategory);

export default router;