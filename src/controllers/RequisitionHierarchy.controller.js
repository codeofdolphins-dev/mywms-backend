import { asyncHandler } from "../utils/asyncHandler";
const { RequisitionHierarchyMaster } = req.dbModels;


const all_entry = asyncHandler(async (req, res) => {
    try {

        const entry = await RequisitionHierarchyMaster.findAll();

        return res.status(200).json({ code: 200, success: true, data: entry });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, success: false, message: error.message});
    }
});

const create_entry = asyncHandler(async (req, res) => {
    try {
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, success: false, message: error.message});
    }
});

const update_entry = asyncHandler(async (req, res) => {
    try {
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, success: false, message: error.message});
    }
});

const delete_entry = asyncHandler(async (req, res) => {
    try {
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, success: false, message: error.message});
    }
});

export { all_entry, create_entry, update_entry, delete_entry };