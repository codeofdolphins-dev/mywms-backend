import { Router } from "express";

import authApi from "./auth.route.js";
import roleApi from "./role.route.js";
import permissionApi from "./permission.route.js";
import locationApi from "./location.route.js";
import managePermissionApi from "./managePermission.route.js";
import vehicleApi from "./vehicle.route.js";
import userApi from "./user.route.js";
import driverApi from "./driver.route.js";
import superAdminApi from "./superAdmin.route.js";
import inwardApi from "./inward.route.js";
import warehouseApi from "./warehouse.route.js";
import requisitionApi from "./requisition.route.js";
import hsnApi from "./hsn.route.js";
import productApi from "./product.route.js";
import categoryApi from "./category.route.js";
import vendorApi from "./vendor.route.js";
import quotationApi from "./quotation.route.js";
import purchaseOrderApi from "./purchasOrder.route.js";
import invoiceApi from "./invoice.route.js";
import outwardApi from "./outward.route.js";
import bomApi from "./bom.route.js";
import brandApi from "./brand.route.js";

import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";

const router = Router();

router.use("/auth", authApi);
router.use("/location", locationApi);
router.use("/warehouse", warehouseApi);
router.use("/user", userApi);
router.use("/product", productApi);
router.use("/brand", brandApi);

router.use(defineUserScope, defineDbObject);

router.use("/vehicle", vehicleApi);
router.use("/driver", driverApi);
router.use("/super-admin", superAdminApi);
router.use("/role", roleApi);
router.use("/permission", permissionApi);
router.use("/manage-permission", managePermissionApi);
router.use("/inward", inwardApi);
router.use("/requisition", requisitionApi);
router.use("/hsn", hsnApi);
router.use("/category", categoryApi);
router.use("/vendor", vendorApi);
router.use("/quotation", quotationApi);
router.use("/purchaseOrder", purchaseOrderApi);
router.use("/invoice", invoiceApi);
router.use("/outward", outwardApi);
router.use("/bom", bomApi);


export default router;