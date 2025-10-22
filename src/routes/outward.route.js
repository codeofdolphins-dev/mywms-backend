import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allOutward, createOutward, deleteOutward, updateOutward, updateOutwardItem } from "../controllers/outward.controller.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all").get(verifyPermission("outward:read"), allOutward);  // optional ?id= &page= &limit=
router.route("/create").post(verifyPermission("outward:create"), createOutward);
router.route("/delete/:id").delete(verifyPermission("outward:delete"), deleteOutward);
router.route("/update").put(verifyPermission("outward:update"), updateOutward);
router.route("/update-item").put(verifyPermission("outward-item:update"), updateOutwardItem);


export default router;