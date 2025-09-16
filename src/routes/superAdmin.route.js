import { Router } from "express";
import { all_company, delete_company, register } from "../controllers/superAdmin.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("company:create"), all_company);    // optional ?page= &limit= &email= &id=

router.route("/register").post(verifyPermission("company:create"), register);
router.route("/delete").post(verifyPermission("company:create"), delete_company);


export default router;