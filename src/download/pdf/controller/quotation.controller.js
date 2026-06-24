import { asyncHandler } from "../../../utils/asyncHandler";

const quotation = asyncHandler(async (req, res) => {
    try {
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});