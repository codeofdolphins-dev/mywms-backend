import { Router } from "express";
import { verifyPermission } from '../middlewares/permission.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { allRegisteredNodes, tenantBusinessNodeList } from "../controllers/businessNode.controller.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";

const router = Router();


router.use(defineUserScope, defineDbObject, verifyJWT);

router.route("/node-list").get(verifyPermission("business-node: read"), tenantBusinessNodeList);
router.route("/registered-node-list").get(verifyPermission("registered-node: read"), allRegisteredNodes);

export default router;