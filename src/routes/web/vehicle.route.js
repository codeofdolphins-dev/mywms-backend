import { Router } from "express";
import { addVehicleForm, addVehicleSubmit, deleteVehicle, editVehicle, editVehicleForm, vehicleList } from "../../controllers/web/vehicle.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(vehicleList);
router.route("/addVehicle").get(addVehicleForm).post(upload.none(), addVehicleSubmit);
router.route("/deleteVehicle").get(deleteVehicle);
router.route("/editVehicle").get(editVehicleForm).post(upload.none(), editVehicle);

export default router;