import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addVehicle, allVehicleList, deleteVehicle, editVehicle, myVehicleList } from "../controllers/vehicle.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-vehicle").get(verifyPermission("vehicle:read"), allVehicleList);     // optional ?id= & v_number=
router.route("/owned-vehicle").get(verifyPermission("vehicle:read"), myVehicleList);
router.route("/delete/:id").get(verifyPermission("vehicle:delete"), deleteVehicle);

router.route("/add").post(verifyPermission("vehicle:add"), addVehicle);
router.route("/edit").post(verifyPermission("vehicle:update"), editVehicle);

export default router;