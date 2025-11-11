import { Router } from "express";
import { allUnit, createUnit, deleteUnit, updateUnit } from "../controllers/unit.controller.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all").get(verifyPermission("unit:read"), allUnit);
router.route("/create").post(verifyPermission("unit:create"), createUnit);
router.route("/update").put(verifyPermission("unit:update"), updateUnit);
router.route("/delete/:id").delete(verifyPermission("unit:delete"), deleteUnit);


export default router;