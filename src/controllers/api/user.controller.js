import CompanyDetails from "../../models/CompanyDetails.model.js";
import User from "../../models/user.model.js";
import IndividualDetails from "../../models/IndividualDetails.model.js"
import Permission from "../../models/global/Permission.model.js";
import Role from "../../models/role.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const currentUser = asyncHandler(async (req, res) => {
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

        // plainUser.permissions = plainUser?.roles?.flatMap(r => {
        //     return r?.permissions?.map(p => (p.permission))
        // });

        plainUser.roles = plainUser.roles?.map(role => ({
            role: role.role,
            permissions: role.permissions?.map(p => p.permission) || []
        }));
        
        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully.", data: plainUser });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



export { currentUser };


// const currentUser = asyncHandler(async (req, res) => {
//     try {
        
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ success: false, code: 500, message: error.message });
//     }
// });