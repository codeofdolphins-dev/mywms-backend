import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { costList, createCost, deleteCost, updateCost } from "../controllers/costCenter.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";

const router = Router();

router.route("/create").post(upload.single("doc"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("costCenter:create"), createCost);
router.route("/update").put(upload.single("doc"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("costCenter:update"), updateCost);


router.use(defineUserScope, defineDbObject, verifyJWT);
router.route("/list").get(verifyPermission("costCenter:read"), costList);
router.route("/delete/:id").delete(verifyPermission("costCenter:delete"), deleteCost);


export default router;
