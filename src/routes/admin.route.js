import { Router } from "express";
import { deleteNode, registerBusinessNode, upsertCompanyDetails } from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { defineUserScope } from "../middlewares/defineUserScope.middleware.js";
import { defineDbObject } from "../middlewares/defineDBObject.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";

const route = Router();


route.route("/register-node").post(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("location:create"), registerBusinessNode);

route.route("/update-details").put(upload.single("image"), defineUserScope, defineDbObject, verifyJWT, verifyPermission("company:update"), upsertCompanyDetails);

route.use(defineUserScope, defineDbObject, verifyJWT);

route.route("/delete/:id").delete(verifyPermission("location:delete"), deleteNode);


export default route;