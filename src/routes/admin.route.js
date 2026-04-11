import { Router } from "express";
import { upsertCompanyDetails } from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const route = Router();

route.use(verifyJWT);

route.route("/update-details").put(upload.single("image"), upsertCompanyDetails);


export default route;