import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    const { User } = req.dbModels; 
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
                
        if (!token) return res.status(401).json({ success: false, code: 401, message: "Unauthorized request" });
        
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        
        const user = await User.findByPk(decodedToken?.id);

        if (!user || !user.accessToken ||  user.accessToken !== token) return res.status(401).json({ success: false, code: 401, message: "Token expired or Invalid token" });

        req.user = user;
        req.isSuperAdmin = decodedToken.isSuperAdmin ? decodedToken.isSuperAdmin : false ;
        // req.role = decodedToken.role;       
        
        next();

    } catch (error) {
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});