import { Router } from "express";

import authApi from "./auth.route.js";
import roleApi from "./role.route.js";
import permissionApi from "./permission.route.js";
import locationApi from "./location.route.js";
import managePermissionApi from "./managePermission.route.js";
import userApi from "./user.route.js";
import superAdminApi from "./superAdmin.route.js";
import requisitionApi from "./requisition.route.js";
import hsnApi from "./hsn.route.js";
import productApi from "./product.route.js";
import categoryApi from "./category.route.js";
import quotationApi from "./quotation.route.js";
import purchaseOrderApi from "./purchasOrder.route.js";
import invoiceApi from "./invoice.route.js";
import bomApi from "./bom.route.js";
import brandApi from "./brand.route.js";
import unitApi from "./unit.route.js";
import supplierApi from "./supplier.route.js";
import businessApi from "./business.route.js";
import packageTypeApi from "./packageType.route.js";
import pdfApi from "../reports/routes/index.route.js";
import inwardApi from "./inward.route.js";

import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";

const router = Router();

router.use("/auth", authApi);
router.use("/location", locationApi);
router.use("/user", userApi);
router.use("/product", productApi);
router.use("/brand", brandApi);
router.use("/super-admin", superAdminApi);
router.use("/business", businessApi);

router.use(defineUserScope, defineDbObject);
router.use("/pdf", pdfApi);

router.use("/role", roleApi);
router.use("/permission", permissionApi);
router.use("/manage-permission", managePermissionApi);
router.use("/requisition", requisitionApi);
router.use("/hsn", hsnApi);
router.use("/category", categoryApi);
router.use("/quotation", quotationApi);
router.use("/purchase-order", purchaseOrderApi);
router.use("/supplier", supplierApi);
router.use("/invoice", invoiceApi);
router.use("/bom", bomApi);
router.use("/unit", unitApi);
router.use("/package-type", packageTypeApi);
router.use("/inward", inwardApi);



export default router;