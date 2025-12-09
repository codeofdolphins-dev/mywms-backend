import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const userTypeList = asyncHandler(async (req, res) => {
    const { UserType } = req.dbModels;
    try {

        const userTypes = await UserType.findAll({
            where: {
                type: {
                    [Op.notIn]: ["Company/Owner", "System"]
                }
            }
        });
        return res.status(200).json({ success: true, code: 200, data: userTypes });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const createUserType = asyncHandler(async (req, res) => {
    const { UserType } = req.dbModels;
    try {
        const { type = "", hierarchy_level = ""  } = req.body;
        if(!type || !hierarchy_level) return res.status(400).json({ success: false, code: 400, message: "Both fields are required!!!" });

        const isExists = UserType.findOne({ where: { hierarchy_level: parseInt(hierarchy_level, 10) } });
        if(isExists) return res.status(409).json({ success: false, code: 409, message: "Hierarchy_level value already exists!!!" });

        const isCreated = await UserType.create({
            type,
            level_code: `L-${parseInt(hierarchy_level, 10)}`,
            hierarchy_level: parseInt(hierarchy_level, 10)
        });
        if(!isCreated) return res.status(500).json({ success: false, code: 500, message: 'Creation Failed!!!' });

        return res.status(201).json({ success: true, code: 201, message: "Record Created" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateUserType = asyncHandler(async (req, res) => {
    const { UserType } = req.dbModels;
    try {

        return res.status(200).json({ success: true, code: 200, data: userTypes });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteUserType = asyncHandler(async (req, res) => {
    const { UserType } = req.dbModels;
    try {
        const { id } = req.params;
        if(!id) return res.status(400).json({ success: false, code: 400, message: "User Type id is required!!!" });

        const userType = await UserType.findByPk(parent(id, 10));
        if(!userType) return res.status(404).json({ success: false, code: 404, message: "User Type not found!!!" });
        
        await userType.destroy();
        return res.status(200).json({ success: true, code: 200, message: "Record Deleted" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { userTypeList, createUserType, updateUserType, deleteUserType };