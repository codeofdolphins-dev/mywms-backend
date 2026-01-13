import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allPackageType, createPackageType, deletePackageType, updatePackageType } from "../controllers/packageType.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/all").get(verifyPermission("packageType:read"), allPackageType);
router.route("/create").post(verifyPermission("packageType:create"), createPackageType);
router.route("/update").put(verifyPermission("packageType:update"), updatePackageType);
router.route("/delete/:id").delete(verifyPermission("packageType:delete"), deletePackageType);


export default router;