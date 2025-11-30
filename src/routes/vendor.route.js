import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import {  } from "../controllers/supplier.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("vendor:read"), );      // optional ?id= &email=
router.route("/delete").get(verifyPermission("vendor:delete"), );

router.route("/create").post(verifyPermission("vendor:create"), );
router.route("/update-vendor").put(verifyPermission("vendor:update"), );
router.route("/update-bank").put(verifyPermission("vendor-bank:update"), );


export default router;