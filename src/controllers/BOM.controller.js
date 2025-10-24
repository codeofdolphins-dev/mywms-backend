import { asyncHandler } from "../utils/asyncHandler";

const allList = asyncHandler(async (req, res) => {
    try {
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const create = asyncHandler(async (req, res) => {
    try {
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



export { allList };