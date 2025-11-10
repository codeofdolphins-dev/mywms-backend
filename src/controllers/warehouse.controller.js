import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt"
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { rootDB } from "../db/tenantMenager.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const allWarehouse = asyncHandler(async (req, res) => {
    const { User, Warehouse } = req.dbModels;

    const { models } = await rootDB();
    const { State, District } = models;

    try {
        let { page = 1, limit = 10, id = "", email = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let warehouse = await User.findAndCountAll({
            where: (id || email) ? { [Op.or]: [{ id: parseInt(id) || null }, { email }] } : { type: "warehouse" },
            attributes: ["id", "email"],
            include: [
                {
                    model: Warehouse,
                    as: "warehouse",
                    attributes: {
                        exclude: ["user_id"]
                    }
                }
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!warehouse) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = warehouse.count;
        const totalPages = Math.ceil(totalItems / limit);
        
        let userData = warehouse.rows[0].toJSON();
        userData.warehouse.state = await State.findByPk(warehouse.rows[0].warehouse.state_id, { attributes: [ "name" ] });
        userData.warehouse.district = await District.findByPk(warehouse.rows[0].warehouse.district_id, { attributes: [ "name" ] });
        warehouse.rows[0] = userData;
        
        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: warehouse,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editWarehouse = asyncHandler(async (req, res) => {
    const { Warehouse } = req.dbModels;
    try {
        const { full_name = "", ph_number = "", address = "", state_id = "", district_id = "", pincode = "", license_no = "", lat = "", long = "", status = "" } = req.body;
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
        if (status) replace_object.status = status;

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
    const { User, Warehouse } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id } = req.params;
        if(!id) return res.status(400).json({ success: false, code: 400, message: "Warehouse id required" });

        const warehouse = await User.findByPk(id, {
            include: [
                {
                    model: Warehouse,
                    as: "warehouse"
                }
            ],
            transaction
        });
        

        if (warehouse.warehouse.profile_image != null) {
            const imagePath = path.join(__dirname, '..', '..', 'public', 'user', warehouse.profile_image);
            fs.unlinkSync(imagePath);
            console.log("✅ Image Deleted.");
        }else{
            console.log("No image available. Skiped...");            
        }

        if (warehouse) {
            await User.destroy({
                where: { id: warehouse.id },
                transaction
            });
        };

        await transaction.commit()

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        if(transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

async function hashPassword(pass) {
    return await bcrypt.hash(pass, parseInt(process.env.SALTROUNDS, 10));
}

export { allWarehouse, editWarehouse, deleteWarehouse };