import path from "path";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import { Op } from "sequelize";

// GET
const currentUser = asyncHandler(async (req, res) => {
    const { User, CompanyDetails, IndividualDetails, Role, Permission } = req.dbModels;
    try {
        const { id } = req.user;

        const user = await User.findByPk(id, {
            attributes: ["id", "email", "status", "createdAt"],
            include: [
                {
                    model: CompanyDetails,
                    as: "companyDetails"
                },
                {
                    model: IndividualDetails,
                    as: "individualDetails"
                },
                {
                    model: Role,
                    as: "roles",
                    attributes: ["role"],
                    through: { attributes: [] },
                    include: [
                        {
                            model: Permission,
                            as: "permissions",
                            attributes: ["permission"],
                            through: { attributes: [] }
                        }
                    ]
                }
            ]
        });
        if(!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });

        const plainUser = user.get({ plain: true });

        if (plainUser.companyDetails === null) {
            delete plainUser.companyDetails;
        } else if (plainUser.individualDetails === null) {
            delete plainUser.individualDetails;
        };

        plainUser.roles = plainUser.roles?.map(role => ({
            role: role.role,
            permissions: 
                role.role === "company/owner" 
                    ? "all access" 
                    : role.role === "admin" 
                ? "all access" 
                    : role.permissions?.map(p => p.permission) || []
        }));
        
        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully.", data: plainUser });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const allEmployeeList = asyncHandler(async (req, res) => {
    const { User, IndividualDetails } = req.dbModels;
    try {
        const { id = "", email = "" } = req.query;

        const conditions = [];
        if(id) conditions.push({ id });
        if(email) conditions.push({ email });

        const user = await User.findAll({
            where:  conditions.length > 0 ? { [Op.or]: conditions } : undefined,
            include: [
                {
                    model: IndividualDetails,
                    as: "individualDetails"
                }
            ]
        });
        if(!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });
        
        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully.", data: plainUser });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
const updateCompanyDetails = asyncHandler(async (req, res) => {
    const { User, CompanyDetails } = req.dbModels;
    try {
        const { companyDetails } = req.user || null;

        const { email = "", c_name = "", ph_no = "", status = "" } = req.body;
        const profile_image = req?.file?.filename || null;
        if(!email) return res.status(400).json({ success: false, code: 400, message: "Email must required!!!" });
        
        const user = await User.findOne({ 
            where: { email }
        })
        if(!user) return res.status(400).json({ success: false, code: 400, message: `Company with email ${email} not found!!!` });

        let updateDetails = {};
        if(c_name) updateDetails.c_name = c_name;
        if(ph_no) updateDetails.ph_no = ph_no;
        if(status) updateDetails.status = status;

        if(profile_image){
            const oldImagePath = path.join(
                process.cwd(),
                "public",
                "user",
                companyDetails.profile_image
            );

            // Safely unlink if file exists
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            updateDetails.profile_image = profile_image;
        }

        const isUpdated = await CompanyDetails.update({
            where: { id: userDetails.id },
            updateDetails
        });

        if(!isUpdated) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Company details updated successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateEmployeeDetails = asyncHandler(async (req, res) => {
    const { IndividualDetails } = req.dbModels;    
    try {
        const { individualDetails } = req.user || null;

        const { full_name = "", phone = "", address = "", state_id = "", district_id = "", pincode = "" } = req.body;
        const profile_image = req?.file?.filename || null;

        let updateDetails = {};
        if(full_name) updateDetails.full_name = full_name;
        if(phone) updateDetails.phone = phone;
        if(address) updateDetails.address = address;
        if(state_id) updateDetails.state_id = state_id;
        if(district_id) updateDetails.district_id = district_id;
        if(pincode) updateDetails.pincode = pincode;

        if(profile_image){
            const oldImagePath = path.join(
                process.cwd(),
                "public",
                "user",
                updateDetails.profile_image
            );

            // Safely unlink if file exists
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            individualDetails.profile_image = profile_image;
        }

        const isUpdated = await IndividualDetails.update({
            where: { id: userDetails.id },
            updateDetails
        });

        if(!isUpdated) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Employee details updated successfully" });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { currentUser, updateCompanyDetails, updateEmployeeDetails, allEmployeeList };


// const currentUser = asyncHandler(async (req, res) => {
//     const { User, IndividualDetails } = req.dbModels;
//     try {
        
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ success: false, code: 500, message: error.message });
//     }
// });