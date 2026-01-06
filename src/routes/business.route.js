import { Router } from "express";
import { verifyPermission } from '../middlewares/permission.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { tenantBusinessNodeList } from "../controllers/businessNode.controller.js";

const router = Router();

router.use(verifyJWT);
router.route("/node-list").get(verifyPermission("business-node: read"), tenantBusinessNodeList);

export default router;