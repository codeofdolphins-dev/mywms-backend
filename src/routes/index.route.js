import { Router } from "express";

const router = Router();

import webAuthRoutes from "./web/auth.route.js";
import webDashboardRoutes from "./web/dashboard.route.js";
import webVehicleRoutes from "./web/vehicle.route.js";
import webLocationRoutes from "./API/location.route.js";
import webCompanyRoutes from "./web/company.route.js";
import webRoleRoutes from "./web/role.route.js";
import webPermissionRoutes from "./web/permission.route.js";
import webManagePermissionRoutes from "./web/managePermission.route.js";
import webInwardRoutes from "./web/inward.route.js";
import webDriverRoutes from "./web/driver.route.js";
import webProductRoutes from "./web/product.route.js";

router.use("/", webDashboardRoutes);
router.use("/auth", webAuthRoutes);
router.use("/vehicle", webVehicleRoutes);
router.use("/driver", webDriverRoutes);
router.use("/company", webCompanyRoutes);
router.use("/role", webRoleRoutes);
router.use("/permission", webPermissionRoutes);
router.use("/manage-permission", webManagePermissionRoutes);
router.use("/inward", webInwardRoutes);
router.use("/product", webProductRoutes);



router.use("/location", webLocationRoutes);

export default router;