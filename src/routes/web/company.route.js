import { Router } from "express";
import { upload } from "../../middlewares/multer.middleware.js"
import { updateCompanyForm, updateCompanySubmit } from "../../controllers/web/company.controller.js";

const router = Router();

router.route("/updateCompany").get(updateCompanyForm).post(upload.single("image"), updateCompanySubmit);

export default router;