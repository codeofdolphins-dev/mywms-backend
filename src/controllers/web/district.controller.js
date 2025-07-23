import District from "../../models/district.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAllDistricts = asyncHandler(async (req, res) => {
    try {
        const { s_id } = req.query;

        const district = await District.findAll({ where: { state_id: s_id } });        

        if(!district) return res.status(500).json({ success: false, code: 500, message: "Unable to fetch!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully", data: district });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const createDistrictsBulk = async (req, res) => {
    try {
        const districts = req.body;

        const district = await District.bulkCreate(districts);

        if (!district) return res.status(400).json({ success: false, code: 400, message: "states not created!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Created Successfully." });;

    } catch (error) {
        console.log(error);        
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

export { getAllDistricts, createDistrictsBulk }