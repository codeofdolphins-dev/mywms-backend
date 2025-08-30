import { Router } from "express";
import { addRole, allRoles, assignRole, deleteRole, editRole, removeRole } from "../../controllers/api/role.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { verifyPermission } from "../../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-role").get(verifyPermission("role:read"), allRoles);
router.route("/delete-role/:id").get(verifyPermission("role:delete"), deleteRole);

router.route("/add-role").post(verifyPermission("role:create"), addRole);
router.route("/edit-role").post(verifyPermission("role:update"), editRole);

router.route("/assign-role").post(verifyPermission("role:assign"), assignRole);
router.route("/remove-role").post(verifyPermission("role:remove"), removeRole);

export default router;