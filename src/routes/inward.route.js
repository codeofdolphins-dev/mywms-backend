import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createInward, getTenantOutwardData, grnItemDetails, grnList, markGrnReport } from "../controllers/inward.controller.js"

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("inward:read"), grnList);
router.route("/item-prefield-data/:po_no").get(getTenantOutwardData);
router.route("/create").post(verifyPermission("inward:create"), createInward);
router.route("/report/:grn_no").put(verifyPermission("inward:create"), markGrnReport);

router.route("/:grn_no").get(grnItemDetails);


export default router;