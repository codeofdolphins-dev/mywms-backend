import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { inventory_scope, inventory_full } from "../controllers/inventory.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/scope_list").get(verifyPermission("inventory:read"), inventory_scope);
router.route("/full_list").get(verifyPermission("inventory:read"), inventory_full);

export default router;