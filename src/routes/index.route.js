import { Router } from "express";

const router = Router();

import webAuthRoutes from "./web/auth.route.js";
import webDashboardRoutes from "./web/dashboard.route.js";
import webVehicleRoutes from "./web/vehicle.route.js";
import webLocationRoutes from "./web/location.route.js";
import webCompanyRoutes from "./web/company.route.js";
import webRoleRoutes from "./web/role.route.js";

router.use("/", webDashboardRoutes);
router.use("/auth", webAuthRoutes);
router.use("/vehicle", webVehicleRoutes);
router.use("/company", webCompanyRoutes);
router.use("/role", webRoleRoutes);




router.use("/location", webLocationRoutes);

export default router;