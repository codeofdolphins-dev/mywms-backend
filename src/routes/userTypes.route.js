import { Router } from "express";
import { userTypeList } from "../controllers/userTypes.controller.js";

const router = Router();

router.route("/list").get(userTypeList);


export default router;