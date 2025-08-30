import { Router } from "express";

import authApi from "./auth.route.js";
import roleApi from "./role.route.js";
import permissionApi from "./permission.route.js";
import locationApi from "./location.route.js";
import managePermissionApi from "./managePermission.route.js";
import vehicleApi from "./vehicle.route.js";
import userApi from "./user.route.js";
import driverApi from "./driver.route.js";
import superAdminApi from "./global/superAdmin.route.js";

const router = Router();

router.use("/user", userApi);
router.use("/auth", authApi);
router.use("/role", roleApi);
router.use("/permission", permissionApi);
router.use("/manage-permission", managePermissionApi);
router.use("/location", locationApi);
router.use("/vehicle", vehicleApi);
router.use("/driver", driverApi);
router.use("/superAdmin", superAdminApi);


export default router;