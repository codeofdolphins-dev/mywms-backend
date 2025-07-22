import { Router } from "express";

const router = Router();

import webAuthRoutes from "./web/auth.route.js"
import webAdminRoutes from "./web/admin.route.js"
import webVehicleRoutes from "./web/vehicle.route.js"

router.use("/", webAdminRoutes);
router.use("/auth", webAuthRoutes);
router.use("/vehicle", webVehicleRoutes);

export default router;