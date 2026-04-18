import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createInward, getTenantOutwardData, grnItemDetailsViaPO, grnList } from "../controllers/inward.controller.js"

const router = Router();

router.use(verifyJWT);

router.route("/create").post(verifyPermission("inward:create"), createInward);
router.route("/list").get(grnList);
router.route("/item-prefield-data/:po_no").get(getTenantOutwardData);
router.route("/:po_no").get(grnItemDetailsViaPO);


export default router;