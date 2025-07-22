import { Router } from "express";
// import { product } from "../../controllers/web/vehicle.controller.js";

const router = Router();

router.route("/").get(product)

export default router;