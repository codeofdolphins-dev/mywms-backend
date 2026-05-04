import { Router } from "express";
import { addRole, allRoles, assignRole, deleteRole, editRole } from "../controllers/role.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-role").get(verifyPermission("role:read"), allRoles);
router.route("/delete-role/:id").delete(verifyPermission("role:delete"), deleteRole);

router.route("/add-role").post(verifyPermission("role:create"), addRole);
router.route("/update-role").put(verifyPermission("role:update"), editRole);

router.route("/manage-role").put(verifyPermission("role:assign"), assignRole);

export default router;