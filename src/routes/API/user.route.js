import { Router } from "express";
import { currentUser } from "../../controllers/api/user.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { DefineTenantSchema } from "../../middlewares/tenant.middleware.js";

const router = Router()

router.use(verifyJWT);
router.use(DefineTenantSchema);

router.route("/current-user").get(currentUser);


export default router;