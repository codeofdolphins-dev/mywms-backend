import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { allProductList, createProduct, deleteProduct, updateProduct, updateProductBatch } from "../controllers/product.controller.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("product:create"), createProduct);
router.route("/update").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("product:update"), updateProduct);

router.use(defineUserScope, defineDbObject, verifyJWT);
router.route("/update-batch").post(verifyPermission("product:update-batch"), updateProductBatch);
router.route("/all-list").get(verifyPermission("product:read"), allProductList); // optional ?barcode= &page= &limit=
router.route("/delete/:id").get(verifyPermission("product:delete"), deleteProduct);

export default router;