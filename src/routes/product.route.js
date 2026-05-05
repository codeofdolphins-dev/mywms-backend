import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { allProductList, createFinishedProduct, createRawProduct, deleteProduct, updateProduct, updateProductBatch } from "../controllers/product.controller.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/list").get(verifyPermission("product:read"), allProductList); // optional ?barcode= &page= &limit=

router.route("/create-finish").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("product:create"), createFinishedProduct);

router.route("/create-raw").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("product:create"), createRawProduct);

router.route("/update").put(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("product:update"), updateProduct);

router.use(defineUserScope, defineDbObject, verifyJWT);
router.route("/delete/:id").delete(verifyPermission("product:delete"), deleteProduct);


router.route("/update-batch").put(verifyPermission("product:update-batch"), updateProductBatch);

export default router;