import { Router } from "express";
import { allHSNList, createHSN, deleteHSN, updateHSN } from "../controllers/hsn.controller.js";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all-list").get(verifyPermission("hsn:read"), allHSNList); // optional ?id= &page= &limit=
router.route("/create").post(verifyPermission("hsn:create"), createHSN);
router.route("/delete/:id").delete(verifyPermission("hsn:delete"), deleteHSN);
router.route("/update").put(verifyPermission("hsn:update"), updateHSN);

export default router;