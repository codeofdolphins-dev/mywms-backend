import { Router } from "express";
import { dashboard } from "../../controllers/web/dashboard.controller.js";
import auth_session from "../../middlewares/checkSession.web.middleware.js";

const router = Router();

router.route("/").get(auth_session, dashboard);

export default router;