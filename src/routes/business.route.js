import { Router } from "express";
import { verifyPermission } from '../middlewares/permission.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { allRegisteredNodes, registeredUserWithNodes, tenantBusinessNodeList } from "../controllers/businessNode.controller.js";

const router = Router();

router.use(verifyJWT);
router.route("/node-list").get(verifyPermission("business-node: read"), tenantBusinessNodeList);
router.route("/registered-node-list").get(verifyPermission("registered-node: read"), allRegisteredNodes);
router.route("/registered-node-list").get(verifyPermission("user: create"), registeredUserWithNodes);

export default router;