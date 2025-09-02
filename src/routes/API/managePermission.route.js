import { Router } from "express";
import { verifyPermission } from "../../middlewares/permission.middleware.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

import { allAssignPermissions, modifyPermissions } from "../../controllers/api/managePermission.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/:roleId").get(verifyPermission("permission:read"), allAssignPermissions);
router.route("/assignPermission").post(verifyPermission("permission:modify"), modifyPermissions);

export default router;