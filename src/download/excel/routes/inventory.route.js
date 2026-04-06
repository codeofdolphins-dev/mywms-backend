import { Router } from "express";
import { sampleOpeningStock } from "../controller/sampleInventory.controller.js";

const router = Router();


router.route("/sample-opening-stock").post(sampleOpeningStock);


export default router;