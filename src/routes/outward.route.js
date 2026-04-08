import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allOutwardList, confirmAllocation, createOutward, outwardItem } from "../controllers/outward.controller.js";

import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("outward:read"), allOutwardList);
router.route("/create").post(verifyPermission("outward:create"), createOutward);
router.route("/:outward_no").get(verifyPermission("outward:read"), outwardItem);
router.route("/dispatch").put(verifyPermission("outward:update"), confirmAllocation);


export default router;