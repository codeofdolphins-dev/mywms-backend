import { Router } from "express";
import { createDistrictsBulk, createStatesBulk, getAllDistricts, getAllStates } from "../controllers/location.controller.js";

const router = Router();

router.route("/state").get(getAllStates).post(createStatesBulk);
router.route("/district").get(getAllDistricts).post(createDistrictsBulk); // ?s_id

export default router;