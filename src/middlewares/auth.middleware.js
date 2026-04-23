import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const { User, BusinessNodeType, Role, Permission, BusinessNode } = req.dbModels;
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) return res.status(401).json({ success: false, code: 401, message: "Unauthorized request" });

        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);

        const user = await User.findByPk(decodedToken?.id, {
            include: [
                ...(BusinessNode ? [{
                    model: BusinessNode,
                    as: "userBusinessNode",
                    attributes: {
                        exclude: ["parent_node_id"]
                    },
                    through: { attributes: [] },
                }] : []
                ),
            ]
        });
        if (!user || !user.accessToken || user.accessToken !== token) return res.status(401).json({ success: false, code: 401, message: "Token expired or Invalid token" });

        const data = user.toJSON();

        // NOTE: If a user is associated with multiple business nodes, backend won't set an activeNode in the middleware. The frontend will need to prompt the user to select an active node after login. This is because backend can't assume which node should be active if there are multiple associate. The frontend can then include the selected activeNode in subsequent requests to ensure the correct context is maintained. If there's only one associated node, then backend can set it as the activeNode by default.
        const activeNode = data?.userBusinessNode?.length === 1 ? data?.userBusinessNode?.[0]?.id : null;

        req.user = data;
        req.activeNode = activeNode;
        req.isAdmin = decodedToken?.isAdmin ? decodedToken.isAdmin : false;
        req.role = decodedToken.role;

        next();

    } catch (error) {
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});