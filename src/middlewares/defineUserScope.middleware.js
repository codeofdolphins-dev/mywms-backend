import { rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const defineUserScope = asyncHandler( async (req, res, next) => {
    try {

        const tenantDB = req.headers["x-tenant-id"];
        if(tenantDB){
            return next();
        };

        const { email } = req.body;
        if(!email) return res.status(400).json({ success: false, code: 400, message: "User EMAIL must required!!!" });

        const { models } = await rootDB();
        const user = await models.User.findOne({ where: { email } });

        if(user){
            req.scope = "root";
        }else{
            req.scope = "tenant";
        }

        return next();
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: "User not exists!!!" });
    }
});