import { application, Router } from "express";
import { addRoleSubmit, deleteRole, editRole, editRoleView, roleView } from "../../controllers/web/role.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { verifyPermission } from "../../middlewares/permission.middleware.js";
import auth_session from "../../middlewares/checkSession.web.middleware.js";

const router = Router();

// router.use(auth_session);

router.route("/").get( roleView);
router.route("/editRole").get(editRoleView).post(verifyPermission("role:edit"), upload.single(), editRole);
router.route("/deleteRole").get(verifyPermission("role:delete"), deleteRole);
router.route("/addRole").post(verifyPermission("role:create"), upload.none(), addRoleSubmit);

export default router;