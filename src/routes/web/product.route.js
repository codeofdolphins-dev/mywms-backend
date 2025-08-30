import { Router } from "express";
import auth_session from "../../middlewares/checkSession.web.middleware.js";
import { verifyPermission } from "../../middlewares/permission.middleware.js";
import { addProduct, addProductView, deleteProduct, editProduct, editProductView, productListAPI, productListView } from "../../controllers/web/product.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = Router();

router.use(auth_session);

router.route("/").get(verifyPermission("product:read"), productListView);
router.route("/add-product").get(addProductView).post(verifyPermission("product:create"), upload.single("product_img"), addProduct);
router.route("/edit-product").get(editProductView).post(verifyPermission("product:update"), upload.single("product_img"), editProduct);
router.route("/delete-product").get(verifyPermission("product:delete"), deleteProduct);

router.route("/api/product-list").get(verifyPermission("product:read"), productListAPI);

export default router;