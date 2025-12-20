import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js"
import { registerSupplier } from "../controllers/supplier.controller.js";

const router = Router();

router.use(verifyJWT);

// router.route("/all").get(verifyPermission("unit:read"), );
router.route("/create").post(verifyPermission("supplier:create"), registerSupplier);
// router.route("/update").put(verifyPermission("unit:update"), );
// router.route("/delete/:id").delete(verifyPermission("unit:delete"), );


export default router;