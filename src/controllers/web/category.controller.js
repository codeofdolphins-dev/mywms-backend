import Category from "../../models/category.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


const getCategory = asyncHandler(async (req, res) => {
    try {

        const category = await Category.findAll({});

        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully", data: category });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const addCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const category = await Category.create({ name });

        if (!category) return res.status(400).json({ success: false, code: 400, message: "Not added!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Added Successfully." });;

    } catch (error) {
        console.log(error);        
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

export { getCategory, addCategory };