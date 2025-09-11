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

import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";

const router = Router();

router.use("/auth", authApi);
router.use("/location", locationApi);


router.use(defineUserScope, defineDbObject);

router.use("/vehicle", vehicleApi);
router.use("/driver", driverApi);
router.use("/super-admin", superAdminApi);
router.use("/user", userApi);
router.use("/role", roleApi);
router.use("/permission", permissionApi);
router.use("/manage-permission", managePermissionApi);
router.use("/inward", inwardApi);
router.use("/warehouse", warehouseApi);


export default router;