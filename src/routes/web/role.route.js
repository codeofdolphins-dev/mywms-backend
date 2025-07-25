import { Router } from "express";
import { addRoleSubmit, deleteRole, editRole, editRoleView, roleView } from "../../controllers/web/role.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(roleView);
router.route("/editRole").get(editRoleView).post(upload.single(), editRole);
router.route("/deleteRole").get(deleteRole);
router.route("/addRole").post(upload.none(), addRoleSubmit);

export default router;