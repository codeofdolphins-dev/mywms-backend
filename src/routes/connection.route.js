import { Router } from "express";
import { createSupplierConnection } from "../controllers/central/connection.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/supplier").post(createSupplierConnection);


export default router;