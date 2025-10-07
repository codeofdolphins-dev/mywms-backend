import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyPermission } from "../middlewares/permission.middleware.js";
import { createInvoice, deleteInvoice, getInvoice, updateInvoice, updateInvoiceItems } from "../controllers/invoice.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/all").get(verifyPermission("invoice:read"), getInvoice);  // optional ?id= &page= &limit=
router.route("/create").post(verifyPermission("invoice:create"), createInvoice);
router.route("/delete/:id").delete(verifyPermission("invoice:delete"), deleteInvoice);
router.route("/update").put(verifyPermission("invoice:update"), updateInvoice);
router.route("/update-item").put(verifyPermission("invoice-item:update"), updateInvoiceItems);

export default router;