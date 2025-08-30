import { Router } from "express";
import { addPermission, deletePermission, editPermission, editPermissionView, permissionView } from "../../controllers/web/permission.controller.js";
import { upload } from "../../middlewares/multer.middleware.js"
import auth_session from "../../middlewares/checkSession.web.middleware.js";
import { verifyPermission } from "../../middlewares/permission.middleware.js";

const router = Router();

// router.use(auth_session);

router.route("/").get( permissionView);
router.route("/addPermission").post(verifyPermission("permission:create"), upload.none(), addPermission);
router.route("/editPermission").get(editPermissionView).post(verifyPermission("permission:update"), upload.none(), editPermission);
router.route("/deletePermission").get(verifyPermission("permission:delete"), deletePermission);

export default router;