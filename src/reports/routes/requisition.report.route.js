import { Router } from "express";

const router = Router();


router.route("/requisition", (req, res) => {
    res.send("download");
});



export default router;