import { Router } from "express";
import { registerBusinessNode, updateBusinessNode, upsertCompanyDetails } from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const route = Router();


route.route("/register-node").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("location:create"), registerBusinessNode);

route.route("/update-node/:id").put(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("location:update"), updateBusinessNode);

route.route("/update-details").put(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("company:update"), upsertCompanyDetails);

route.use(defineUserScope, defineDbObject, verifyJWT);


export default route;