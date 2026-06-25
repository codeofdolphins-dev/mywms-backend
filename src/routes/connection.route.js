import { Router } from "express";
import { createSupplierConnection, createUpdateTraderConnection, getConnectionList, updateConnectionType } from "../controllers/central/connection.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(getConnectionList);
router.route("/supplier").post(createSupplierConnection);
router.route("/trader").post(createUpdateTraderConnection);
router.route("/:id/type").put(updateConnectionType);


export default router;