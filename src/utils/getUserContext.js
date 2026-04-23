/**
 * Reusable helper to fetch the full user context (profile, roles, permissions, active node, store).
 * Extracts the same logic used in the `currentUser` controller so any controller can call it.
 *
 * @param {Object} req - Express request object (must have req.dbModels, req.user, req.activeNode set by middleware)
 * @returns {Promise<Object>|null} - Fully populated user object, or null if user not found
 */
export const getUserContext = async (req) => {
    const { User, Role, Permission, BusinessNode, NodeDetails, BusinessNodeType, ManufacturingUnit } = req.dbModels;
    const { id } = req.user;

    const user = await User.findByPk(id, {
        attributes: {
            exclude: ["password", "accessToken"]
        },
        include: [
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
            },
            ...(BusinessNode ? [{
                model: BusinessNode,
                as: "userBusinessNode",
                attributes: {
                    exclude: ["parent_node_id"]
                },
                through: {
                    attributes: ["isNodeAdmin", "department", "store_id"],
                },
                include: [
                    {
                        model: NodeDetails,
                        as: "nodeDetails",
                        attributes: {
                            exclude: ["business_node_id"]
                        }
                    },
                    {
                        model: BusinessNodeType,
                        as: "type",
                    },
                ]
            }] : []
            ),
        ]
    });

    if (!user) return null;

    const plainUser = user.toJSON();

    // set active node
    plainUser.activeNode = plainUser?.userBusinessNode?.find(node => node.id === req.activeNode);

    // remove businessnode array
    delete plainUser?.userBusinessNode;

    /** set store */
    const nodeUser = plainUser.activeNode?.NodeUser;
    if (nodeUser?.store_id) {
        const store = await ManufacturingUnit.findByPk(nodeUser.store_id);
        plainUser.activeNode.store = store.toJSON();
    }

    /** set roles */
    plainUser.roles = plainUser.roles?.map(role => ({
        role: role.role,
        permissions:
            ["owner", "company", "admin"].includes(role.role)
                ? "all access"
                : role.permissions?.map(p => p.permission) || []
    }));

    return plainUser;
};
