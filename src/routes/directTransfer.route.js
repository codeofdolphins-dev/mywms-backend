import { Router } from "express";
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createRecord, list, updateRecord, deleteRecord, getCreateDirectTransferContext } from "../controllers/directTransfer.controller.js";

const router = Router();

router.use(verifyJWT);

// Checked on dataset.js file

router.route("/list").get(verifyPermission("directTransfer:read"), list);
router.route("/list/context").get(getCreateDirectTransferContext);
router.route("/create").post(verifyPermission("directTransfer:create"), createRecord);
router.route("/update").put(verifyPermission("directTransfer:update"), updateRecord);
router.route("/delete/:id").delete(verifyPermission("directTransfer:delete"), deleteRecord);


export default router;