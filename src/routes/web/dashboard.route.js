import { Router } from "express";
import { dashboard } from "../../controllers/web/dashboard.controller.js";

const router = Router();

router.route("/").get(dashboard);

export default router;