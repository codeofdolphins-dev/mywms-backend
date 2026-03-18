import { Op, Sequelize } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeFirstWord } from "../helper/helper.js";

// GET
const supplierList = asyncHandler(async (req, res) => {
    const { Supplier } = req.dbModels;

    try {
        let { page = 1, limit = 10, id = "", text = "", type = "", mode = "", status = "", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const supplier = await Supplier.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(text ? {
                    [Op.or]: [
                        { contact_phone: { [Op.like]: `${text}%` } },
                        { contact_email: { [Op.iLike]: `${text}%` } },
                        Sequelize.where(
                            Sequelize.json("name.full_name"),
                            { [Op.iLike]: `${text}%` }
                        )
                    ]
                } : {}),
                ...(type && { supplier_type: type }),
                ...(mode && { business_mode: mode }),
                ...(status && { status: status }),
            },
            ...(noLimit ? {} : { limit, offset }),
            order: [["createdAt", "ASC"]]
        });
        if (!supplier) throw new Error("Fetched failed!!!");

        const totalItems = supplier.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: supplier.rows,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteSupplier = asyncHandler(async (req, res) => {
    const { Supplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { id } = req.params;

        const supplier = await Supplier.findByPk(parseInt(id, 10));
        if (!supplier) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: 'Record Not found!!!' });
        }

        const isDelete = await Supplier.destroy({ where: { id }, transaction });
        if (!isDelete) throw new Error("Deletion Failed!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record deleted" });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const registerManufacturingUnit = asyncHandler(async (req, res) => {
    // console.log(req.body); return
    const { ManufacturingUnit, BusinessNode, BusinessNodeType } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { business_node_id = "", name = "", store_type = "rm_store", location = "", address = "", state = "", district = "", lat = "", long = "" } = req.body;

        if ([business_node_id, name, location].some(item => item === "")) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };

        const businessNode = await BusinessNode.findByPk(
            Number(business_node_id), {
            include: [
                {
                    model: BusinessNodeType,
                    as: "type",
                },
            ]
        });
        if (!businessNode) throw new Error("Business Node not found!!!");

        if (businessNode?.type?.category !== "manufacturing") {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "stores are only linked with manufacturing units!!!" });
        };

        const manufacturingUnit = await ManufacturingUnit.create({
            business_node_id,
            name,
            store_type,
            location: phone_no,
            address: {
                address,
                state,
                district,
                pincode,
                lat,
                long
            },
        }, { transaction });
        if (!manufacturingUnit) throw new Error("Record not created!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Supplier added successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateSupplierDetails = asyncHandler(async (req, res) => {
    const { Supplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { id = "", email = "", full_name = "", phone_no = "", address = "", state = "", district = "", pincode = "", desc = "", status } = req.body;
        if (!email || !id) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Id and Email must required!!!" });
        }

        const supplier = await Supplier.findOne({ where: { contact_email: email, id: Number(id) } });
        if (!supplier) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: `Supplier not found!!!` });
        };

        if (full_name) {
            supplier.name.full_name = full_name;
            supplier.name.first_name = full_name.split(" ")[0];
            supplier.name.last_name = removeFirstWord(full_name);
        };
        if (phone_no) supplier.contact_phone = phone_no;

        if (address) supplier.address.address = address;
        if (state) supplier.address.state = state;
        if (district) supplier.address.district = district;
        if (pincode) supplier.address.pincode = pincode;

        if (desc) supplier.meta.desc = desc;

        const isUserUpdate = await supplier.save({ transaction });
        if (!isUserUpdate) throw new Error("Updation failed!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Details Updated." });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});