import { Router } from "express";
import { addCategory, getCategory } from "../../controllers/web/category.controller";

const router = Router();

router.route("/category").get(getCategory).post(addCategory);

export default router;