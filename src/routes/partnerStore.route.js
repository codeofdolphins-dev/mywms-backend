import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyPermission } from "../middlewares/permission.middleware.js"
import { deletePartnerStore, partnerStoreList, registerPartnerStore, updatePartnerStore } from "../controllers/partnerStore.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/list").get(verifyPermission("partner-store:read"), partnerStoreList);
router.route("/create").post(verifyPermission("partner-store:create"), registerPartnerStore);
router.route("/update").put(verifyPermission("partner-store:update"), updatePartnerStore);
router.route("/delete/:id").delete(verifyPermission("partner-store:delete"), deletePartnerStore);

export default router;