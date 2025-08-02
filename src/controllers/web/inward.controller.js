import User from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import bcrypt from "bcrypt"
import renderPage from "../../utils/renderPage.js";


// GET request
const inwardFormView = async(req, res) => {

    const user = req.session.user;

    const data = await renderPage("./inward/inward");

    return res.render("../layout", {
        head: `
            <link rel="stylesheet" href="/assets/css/customeCss/inward.css">
        `,
        customeScript: `
            <script src="/assets/js/modal.js"></script>
            <script type="module" src="/assets/js/customejs/role.js"></script>
        `,
        user,
        body: data,
        title: "Inward"
    });
}

export { inwardFormView }