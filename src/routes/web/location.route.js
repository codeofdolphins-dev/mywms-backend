import { Router } from "express";
import { createStatesBulk, getAllStates } from "../../controllers/web/state.controller.js";
import { createDistrictsBulk, getAllDistricts } from "../../controllers/web/district.controller.js";

const router = Router();

router.route("/state").get(getAllStates).post(createStatesBulk);
router.route("/district").get(getAllDistricts).post(createDistrictsBulk);

export default router;