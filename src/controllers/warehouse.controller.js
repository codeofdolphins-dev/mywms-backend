import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt"
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const allWarehouse = asyncHandler(async (req, res) => {
    const { Warehouse } = req.dbModels;
    try {

        const { id } = req.query;

        const warehouse = await Warehouse.findAll({
            where: id ? { id } : undefined
        });

        if (!warehouse) return res.status(500).json({ success: false, code: 500, message: "Data fetched failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Warehouse Register Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const addWarehouse = asyncHandler(async (req, res) => {
    const { User, Warehouse } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { email = "", password = "", full_name = "", ph_number = "", address = "", state_id = "", district_id = "", pincode = "", gst_no = "", license_no = "", lat = "", long = "", cat_id = "" } = req.body;
        const profile_image = req?.file?.filename || null;


        if ([full_name, ph_number, address, state_id, district_id, pincode, gst_no, license_no].some(item => item === "")) return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });


        const isRegister = await User.findOne({ where: { email } }, { transaction });
        if (isRegister) return res.status(400).json({ success: false, code: 400, message: `Warehouse with email: ${email} already exists!!!` });

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email,
            password: encryptPassword,
            type: "warehouse"
        }, { transaction });

        const warehouse = await Warehouse.create({
            user_id: user.id,
            full_name,
            f_name: full_name.split(" ")[0],
            l_name: full_name.split(" ")[1],
            ph_number,
            profile_image,
            address,
            state_id,
            district_id,
            pincode,
            gst_no,
            license_no,
            lat,
            long,
            cat_id,
        }, { transaction });

        await transaction.commit();

        if (!warehouse) return res.status(500).json({ success: false, code: 500, message: "Warehouse creation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Warehouse Register Successfully." });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editWarehouse = asyncHandler(async (req, res) => {
    const { Warehouse } = req.dbModels;

    try {
        const { full_name = "", ph_number = "", address = "", state_id = "", district_id = "", pincode = "", license_no = "", lat = "", long = "", cat_id = "" } = req.body;
        const profile_image = req?.file?.filename || null;
        if (!license_no) return res.status(400).json({ success: false, code: 400, message: "License no must required!!!" });

        const warehouse = await Warehouse.findOne({ where: { license_no } })
        if (!warehouse) return res.status(400).json({ success: false, code: 400, message: "Warehouse not found!!!" });

        const oldImag = warehouse.profile_image;

        let replace_object = {}
        if (full_name) {
            replace_object.full_name = full_name.trim();
            replace_object.f_name = full_name.split(" ")[0].trim();
            replace_object.l_name = full_name.split(" ")[1].trim();
        };
        if (ph_number) replace_object.ph_number = ph_number.trim();
        if (address) replace_object.address = address.trim();
        if (state_id) replace_object.state_id = state_id.trim();
        if (district_id) replace_object.district_id = district_id.trim();
        if (pincode) replace_object.pincode = pincode.trim();
        if (lat) replace_object.lat = lat.trim();
        if (long) replace_object.long = long.trim();
        if (cat_id) replace_object.cat_id = cat_id.trim();

        if (profile_image) {
            const imagePath = path.join(__dirname, '..', '..', 'public', 'user', oldImag);
            fs.unlinkSync(imagePath);
            replace_object.profile_image = profile_image.trim();
        }

        const isUpdate = await Warehouse.update(
            replace_object,
            { where: { license_no } }
        );
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteWarehouse = asyncHandler(async (req, res) => {
    const { Warehouse } = req.dbModels;
    try {

        const { id } = req.params;

        const isDelete = await Warehouse.destory({ where: id });
        if(!isDelete) return res.status(500).json({ success: false, code: 500, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

async function hashPassword(pass) {
    return await bcrypt.hash(pass, parseInt(process.env.SALTROUNDS, 10));
}

export { addWarehouse, allWarehouse, editWarehouse, deleteWarehouse };