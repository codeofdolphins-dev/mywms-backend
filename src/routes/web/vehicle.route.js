import { Router } from "express";
import { addVehicleForm, addVehicleSubmit, deleteVehicle, editVehicle, editVehicleForm, vehicleList } from "../../controllers/web/vehicle.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";
import auth_session from "../../middlewares/checkSession.web.middleware.js";

const router = Router();

// router.use(auth_session);

router.route("/").get(vehicleList);
router.route("/addVehicle").get(addVehicleForm).post(upload.none(), addVehicleSubmit);
router.route("/deleteVehicle").get(deleteVehicle);


router.route("/editVehicle").get(editVehicleForm).post(upload.none(), editVehicle);

export default router;