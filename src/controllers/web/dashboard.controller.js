import User from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import bcrypt from "bcrypt"
import renderPage from "../../utils/renderPage.js"


// GET request
const dashboard = async (req, res) => {
    const user = req.session.user;

    // if (!user) res.redirect("/auth/login");

    const data = await renderPage("dashboard") || "";

    return res.render("../layout", {
        head: `<link href="assets/css/lib/chartist/chartist.min.css" rel="stylesheet">
            `,
        customeScript: `
            <script src="assets/js/lib/chartist/chartist.min.js"></script>
            <script src="assets/js/lib/chartist/chartist-init.js"></script>
            <script src="assets/js/lib/sparklinechart/jquery.sparkline.min.js"></script>
            <script src="assets/js/lib/sparklinechart/sparkline.init.js"></script>
            <script type="module" src="/assets/js/customejs/dashboard.js"></script>
        `,
        user,
        body: data,
        title: "Dashboard"
    });
};



// POST request


export { dashboard }