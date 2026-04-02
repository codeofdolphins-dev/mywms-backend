import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allOutward, createOutward } from "../controllers/outward.controller.js";

import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("outward:read"), allOutward);
router.route("/create").post(verifyPermission("outward:create"), createOutward);
// router.route("/delete/:id").delete(verifyPermission("outward:delete"),);
// router.route("/update").put(verifyPermission("outward:update"),);
// router.route("/update-item").put(verifyPermission("outward-item:update"),);


export default router;