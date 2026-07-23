import { Router } from "express";
import { createSupplierConnection, createTraderConnection, getConnectionList, updateConnectionType } from "../controllers/central/connection.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(getConnectionList);
router.route("/supplier").put(createSupplierConnection);
router.route("/trader").put(createTraderConnection);
router.route("/:id/type").put(updateConnectionType);


export default router;