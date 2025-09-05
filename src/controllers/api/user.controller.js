import { asyncHandler } from "../../utils/asyncHandler.js";

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



export { currentUser };


// const currentUser = asyncHandler(async (req, res) => {
//     try {
        
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ success: false, code: 500, message: error.message });
//     }
// });