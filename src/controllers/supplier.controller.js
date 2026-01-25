import { Op, Sequelize } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeFirstWord } from "../helper/removeFirstWord.js";

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
const registerSupplier = asyncHandler(async (req, res) => {
    // console.log(req.body); return
    const { Supplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { email = "", full_name = "", phone_no = "", address = "", state = "", district = "", pincode = "", desc = "", status } = req.body;

        if ([email, full_name, phone_no].some(item => item === "")) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const isSupplierExists = await Supplier.findOne({ where: { contact_email: email }, transaction });
        if (isSupplierExists) {
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Supplier: ${full_name} with email: ${email} already exists!!!` });
        };

        const supplier = await Supplier.create({
            contact_email: email.toLowerCase().trim(),
            name: {
                full_name,
                first_name: full_name.split(" ")[0],
                last_name: removeFirstWord(full_name),
            },
            contact_phone: phone_no,
            address: {
                address,
                state: state.name,
                district: district.name,
                pincode
            },
            ...(status && { status }),
            meta: { desc }
        }, { transaction });
        if (!supplier) throw new Error("Record not created!!!");

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

export { registerSupplier, supplierList, updateSupplierDetails, deleteSupplier };