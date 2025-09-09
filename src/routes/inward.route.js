import { Router } from "express";
import { createInward, deleteInward, getInward } from "../controllers/inward.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT);

router.route("all-inward").get(getInward);  // optional ?id=*
router.route("create").post(createInward);
router.route("delete").post(deleteInward);

export default router;