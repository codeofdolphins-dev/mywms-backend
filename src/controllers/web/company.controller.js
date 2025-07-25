import Company from "../../models/company.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import renderPage from "../../utils/renderPage.js";
import Role from "../../models/role.model.js"


// Get request

const companyRegisterForm = async (req, res) => {
    return res.render("companyRegister");
}

const updateCompanyForm = asyncHandler(async (req, res) => {    

    try {
        const id = req.query.id || req.session.user.id;
        
        const user = req.session.user;

        const company = await Company.findByPk(id);
        const companyDetails = company.get({ plain: true });

        const data = await renderPage("./profile/companyProfileUpdate", companyDetails) || "";

        return res.render("../layout", {
            head: ``,
            customeScript: `
            <script src="/assets/js/sweetalert2@11.js"></script>
            <script type="module" src="/assets/js/customejs/profile/companyProfileUpdate.js"></script>`,
            user,
            body: data,
            title: "Edit Company Profile"
        });

    } catch (error) {
        console.log(error);
    }
});

// POST request
const companyRegisterSubmit = asyncHandler(async (req, res) => {
    try {
        const { email = "", c_name = "", pass = "", ph_no = "", role = "" } = req.body;
        const filename = req.file?.filename || "";

        if ([email, c_name, pass].some(field => field === "")) {
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }

        let companyRole = "";
        if(role){
            companyRole = await Role.findOne({ where: { role } });
            if(!companyRole) return res.status(404).json({ success: false, code: 404, message: 'Role not found!' });
        }
        else return res.status(400).json({ success: false, code:400, message: 'Role is required!' });


        const isExists = await Company.findOne({ where: { email } });

        if (isExists) return res.status(400).json({ success: false, code: 400, message: `Company with email: ${email} alrady exists!!!` });

        const hashPassword = await bcrypt.hash(pass, parseInt(process.env.SALTROUNDS, 10));

        const company = await Company.create({
            email,
            password: hashPassword,
            c_name,
            ph_no,
            profile_image: filename
        });

        await company.addRole(companyRole);

        if (company) return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const companyLoginSubmit = asyncHandler(async (req, res) => {
    try {
        const { email = "", password = "" } = req.body;

        if (!email || !password) return res.status(400).json({ success: false, code: 400, message: "Email and Password are required!" });

        const company = await Company.findOne({ where: { email } });

        if (!company) return res.status(400).json({ success: false, code: 400, message: "User Not Found!" });

        const is_password_matched = await bcrypt.compare(password, company.password);

        if (is_password_matched) {

            const cleanedData = company.dataValues;

            delete cleanedData.password;
            delete cleanedData.accessToken;

            req.session.user = cleanedData;

            return res.status(200).json({ success: true, code: 200, message: "Login Successfully" });
        }
        return res.status(401).json({ success: false, code: 401, message: "Wrong Password!" });

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message })
    };
});

const updateCompanySubmit = asyncHandler(async (req, res) => {
    try {
        // const { id } = req.query || req.session.user;

        const { id, c_name = "", email = "", ph_no = "", pass = "" } = req.body;
        const filename = req.file?.filename || "";

        const company = await Company.findByPk(id);

        if(!company) throw new Error("Something Wrong!!!! provide data not matched!!!");

        let updateFields = {};
        if(c_name) updateFields.c_name = c_name;
        if(email) updateFields.email = email;
        if(ph_no) updateFields.ph_no = ph_no;
        if(filename) updateFields.profile_image = filename;

        if(pass){
            const hashPassword = await bcrypt.hash(pass, parseInt(process.env.SALTROUNDS, 10));
            updateFields.password = hashPassword;
        }


        const updateCompany = await Company.update(
            updateFields,
            { where: { id } }
        );

        if(!updateCompany) return res.status(500).json({ status: false, code: 500, message: "Details updation failed!!!!" });

        req.session.user = await Company.findByPk(id);
        
        return res.status(200).json({ success: true, code: 200, message: "Details Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteCompany = asyncHandler(async (req, res) => { });



export { companyRegisterForm, companyRegisterSubmit, companyLoginSubmit, updateCompanySubmit, deleteCompany, updateCompanyForm };