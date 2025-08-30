import { Router } from "express";
import { assignPermissions, assignPermissionView } from "../../controllers/web/managePermission.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { verifyPermission } from "../../middlewares/permission.middleware.js";
import auth_session from "../../middlewares/checkSession.web.middleware.js";

const router = Router();
// router.use(auth_session);

router.route("/").get((_, res) => {
    return res.redirect("/");    
})

router.route("/:roleId").get( assignPermissionView);
router.route("/assignPermission").post( upload.none(), assignPermissions);

export default router;