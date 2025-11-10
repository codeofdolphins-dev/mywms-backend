import { Router } from "express";
import { all_company, delete_company, register, updateCompanyDetails } from "../controllers/superAdmin.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("company:read"), all_company);    // optional ?page= &limit= &email= &id=

router.route("/register").post(verifyPermission("company:create"), register);
router.route("/delete").post(verifyPermission("company:delete"), delete_company);
router.route("/update-company-details").put(upload.single("image"), verifyJWT, verifyPermission("company:update"), updateCompanyDetails);


export default router;