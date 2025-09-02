import District from "../../models/District.model.js";
import State from "../../models/State.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAllStates = asyncHandler(async (_, res) => {
    try {

        const state = await State.findAll({});

        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully", data: state });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const getAllDistricts = asyncHandler(async (req, res) => {
    try {
        const { s_id } = req.query;

        if (!s_id) return res.status(400).json({ success: false, code: 400, message: "state is required!!!" });

        const district = await District.findAll({ where: { state_id: s_id } });

        if (!district) return res.status(500).json({ success: false, code: 500, message: "Unable to fetch!!!" });

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

        if (!district) return res.status(400).json({ success: false, code: 400, message: "Districts not created!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Created Successfully." });;

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

const createStatesBulk = async (req, res) => {
    try {
        const states = req.body;
        const createdStates = await State.bulkCreate(states);

        if (!createdStates) return res.status(400).json({ success: false, code: 400, message: "states not created!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Bulk Created Successfully." });;

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};


export { getAllStates, getAllDistricts, createStatesBulk, createDistrictsBulk };