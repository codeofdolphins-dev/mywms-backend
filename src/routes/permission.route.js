import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addPermission, allPermissions, deletePermission, editPermission } from "../controllers/permission.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-permission").get(verifyPermission("permission:read"), allPermissions);
router.route("/add-Permission").post(verifyPermission("permission:create"), addPermission);
router.route("/edit-Permission").post(verifyPermission("permission:update"), editPermission);

router.route("/delete-Permission/:id").get(verifyPermission("permission:delete"), deletePermission);

export default router;