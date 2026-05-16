import { Router } from "express";
import inventoryApi from "./inventory.route.js";

const router = Router();

router.use("/inventory", inventoryApi);

export default router;