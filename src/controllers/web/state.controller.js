import State from "../../models/state.model.js";
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

export { getAllStates, createStatesBulk };