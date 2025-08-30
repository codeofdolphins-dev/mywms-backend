import { Router } from "express";
import { addVehicleForm, addVehicleSubmit, deleteVehicle, editVehicle, editVehicleForm, vehicleList, vehicleListAPI } from "../../controllers/web/vehicle.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";
import auth_session from "../../middlewares/checkSession.web.middleware.js";
import { verifyPermission } from "../../middlewares/permission.middleware.js";

const router = Router();

router.use(auth_session);

router.route("/").get(verifyPermission("vehicle:read"), vehicleList);
router.route("/addVehicle").get(addVehicleForm).post(verifyPermission("vehicle:add"), upload.none(), addVehicleSubmit);
router.route("/deleteVehicle").get(verifyPermission("vehicle:delete"), deleteVehicle);
router.route("/editVehicle").get(editVehicleForm).post(verifyPermission("vehicle:update"), upload.none(), editVehicle);


router.route("/api/vehicle-list").get(verifyPermission("vehicle:read"), vehicleListAPI);


export default router;