import { Router } from "express";
import { createInward } from "../../controllers/api/inward.controller.js";

const router = Router();

router.route("create-inward").post(createInward);

export default router;