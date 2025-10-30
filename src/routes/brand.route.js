import { Router } from "express";
import { allBrand, createBrand, deleteBrand, updateBrand } from "../controllers/brand.controller.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/create").post(upload.single("logo"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("brand:create"), createBrand);
router.route("/update").put(upload.single("logo"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("brand:update"), updateBrand);

router.use(defineUserScope, defineDbObject, verifyJWT);
router.route("/all").get(verifyPermission("brand:read"), allBrand);  // optional ?id= &name= &page= &limit=
router.route("/delete/:id").delete(verifyPermission("brand:delete"), deleteBrand);


export default router;