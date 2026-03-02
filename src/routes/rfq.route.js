import { Router } from "express";
import { allRfqList } from "../controllers/rfq.controller.js";

const router = Router();

router.route("/list").get(allRfqList);

export default router;