import { Router } from "express";

const router = Router();

import webAuthRoutes from "./web/auth.route.js"
import webAdminRoutes from "./web/dashboard.route.js"
import webVehicleRoutes from "./web/vehicle.route.js"
import webLocationRoutes from "./web/location.route.js"

router.use("/", webAdminRoutes);
router.use("/auth", webAuthRoutes);
router.use("/vehicle", webVehicleRoutes);
router.use("/location", webLocationRoutes);

export default router;