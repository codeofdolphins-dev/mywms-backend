import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { inventory } from "../controllers/inventory.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("inventory:read"), inventory);


export default router;