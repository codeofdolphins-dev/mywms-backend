import { Router } from "express";
import { adminDashboard, role } from "../../controllers/web/admin.controller.js";

const router = Router();


router.route("/").get(adminDashboard)
router.route("/role").get(role)

export default router;