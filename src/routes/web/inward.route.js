import { Router } from "express";
import { inwardFormView } from "../../controllers/web/inward.controller.js";

const router = Router();

router.route("/").get(inwardFormView);


export default router;