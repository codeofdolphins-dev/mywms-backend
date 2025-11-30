import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler";
const { RequisitionHierarchyMaster, RequisitionHierarchy } = req.dbModels;


const all_entry = asyncHandler(async (req, res) => {
    try {

        const entry = await RequisitionHierarchyMaster.findAll();

        return res.status(200).json({ code: 200, success: true, data: entry });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, success: false, message: error.message });
    }
});

const create_entry = asyncHandler(async (req, res) => {
    try {
        const { module_name = "" } = req.body;
        const isExists = await RequisitionHierarchyMaster.findOne({ where: { module_name: { [Op.iLike]: module_name } } });
        if (isExists) return res.status(400).json({ code: 400, success: false, message: `Module ${module_name} already exists!!!` });

        await RequisitionHierarchyMaster.create({ module_name });
        return res.status(201).json({ code: 201, success: true, message: "Created Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, success: false, message: error.message });
    }
});

const update_entry = asyncHandler(async (req, res) => {
    try {
        const { id, module_name, status } = req.body;

        const entry = await RequisitionHierarchyMaster.findByPk(parseInt(id, 10));
        if (!entry) return res.status(404).json({ code: 404, success: false, message: "Entry not found!!!" });

        await entry.update({
            ...(module_name !== undefined && { module_name }),
            ...(status !== undefined && { status })
        });
        return res.status(200).json({ code: 200, success: true, message: "Updated Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, success: false, message: error.message });
    }
});

const delete_entry = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await RequisitionHierarchyMaster.findByPk(parseInt(id, 10));
        if (!entry) return res.status(404).json({ code: 404, success: false, message: "Entry not found!!!" });

        await entry.destroy();
        return res.status(200).json({ code: 200, success: true, message: "Deleted Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, success: false, message: error.message });
    }
});

const create_requisition_hierarchy = asyncHandler(async (req, res) => {
    try {
        const { company_id, module_id, sequence_order } = req.body;
        await RequisitionHierarchy.create({ company_id, module_id, sequence_order });
        return res.status(201).json({ code: 201, success: true, message: "Requisition Hierarchy Created Successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, success: false, message: error.message });
    }
});




export { all_entry, create_entry, update_entry, delete_entry, create_requisition_hierarchy };