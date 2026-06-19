import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { allProductList, bulkProductCreation, createProduct, createRawProduct, deleteProduct, updateProduct, updateProductBatch } from "../controllers/product.controller.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { upload, uploadMemory } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/create").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("product:create"), createProduct);

router.route("/create-raw").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("product:create"), createRawProduct);

router.route("/bulk-upload").post(uploadMemory.single("file"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("product:create"), bulkProductCreation);

router.route("/update").put(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("product:update"), updateProduct);

router.use(defineUserScope, defineDbObject, verifyJWT);
router.route("/list").get(verifyPermission("product:read"), allProductList); // optional ?barcode= &page= &limit=
router.route("/delete/:id").delete(verifyPermission("product:delete"), deleteProduct);



router.route("/update-batch").put(verifyPermission("product:update-batch"), updateProductBatch);

export default router;