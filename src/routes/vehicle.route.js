import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addVehicle, allVehicleList, deleteVehicle, editVehicle } from "../controllers/vehicle.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-vehicle").get(verifyPermission("vehicle:read"), allVehicleList);
router.route("/delete-vehicle/:id").get(verifyPermission("vehicle:delete"), deleteVehicle);

router.route("/add-vehicle").post(verifyPermission("vehicle:add"), addVehicle);
router.route("/edit-vehicle").post(verifyPermission("vehicle:update"), editVehicle);

export default router;