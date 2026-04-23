import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js"
import { getUserContext } from "../utils/getUserContext.js"
import { generateNo } from "../helper/generate.js"


// GET
export const transferOrderList = asyncHandler(async (req, res) => {
    const { TransferOrder, TransferOrderItem, TransferOrderAllocation, Product, ManufacturingUnit } = req.dbModels;

    try {
        let { page = 1, limit = 10, id = "", text = "", type = "material_issue", status = "", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const user = await getUserContext(req);
        const store = user.activeNode?.store;

        const transferOrders = await TransferOrder.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(text ? { transfer_no: { [Op.iLike]: `%${text}%` } } : {}),
                ...(type && { type }),
                ...(status && { status }),
                ...(store && {
                    [Op.or]: [
                        { from_location_id: store.id },
                        { to_location_id: store.id }
                    ]
                })
            },
            include: [
                {
                    model: TransferOrderItem,
                    as: "transferOrderItem",
                    include: [
                        {
                            model: Product,
                            as: "transferProduct"
                        },
                        {
                            model: TransferOrderAllocation,
                            as: "transferItemAllocation"
                        },
                    ]
                }
            ],
            ...(noLimit ? {} : { limit, offset }),
            order: [["createdAt", "DESC"]]
        });

        if (!transferOrders) throw new Error("Fetched failed!!!");

        /** normalized */
        const formatedData = await Promise.all(transferOrders.rows?.map(async (item) => {
            const plain_JSON = item.toJSON();

            if (plain_JSON.from_location_type === "mfg_unit") {
                plain_JSON.from_location = await ManufacturingUnit.findByPk(plain_JSON.from_location_id, { attributes: ["name"] });
            }
            if (plain_JSON.to_location_type === "mfg_unit") {
                plain_JSON.to_location = await ManufacturingUnit.findByPk(plain_JSON.to_location_id, { attributes: ["name"] });
            }
            return plain_JSON;
        }));

        const totalItems = transferOrders.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: formatedData,
            pagination: {
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


// POST
export const createTransferRequest = asyncHandler(async (req, res) => {
    const { TransferOrder, TransferOrderItem, ManufacturingUnit, Product } = req.dbModels;

    // console.log(req.role); return

    try {
        const { type = "", required_date = "", rm_store_id = "", items = {} } = req.body;

        if ([type, required_date, rm_store_id, items].some(i => i === "")) throw new Error("Required fields are missing!!!");

        const user = await getUserContext(req);
        const store = user.activeNode?.store;

        if (store?.store_type !== "production") throw new Error("Only production users can create this!!!");

        const rmStore = await ManufacturingUnit.findByPk(
            Number(rm_store_id),
            {
                where: {
                    store_type: "rm_store"
                }
            }
        );
        if (!rmStore) throw new Error("RM store record not found!!!")


        // console.log(user); return

        // Create Transfer Order
        const transferOrder = await TransferOrder.create({
            type,
            from_parent_node_id: store.business_node_id,
            from_location_id: store.id,

            to_parent_node_id: rmStore.business_node_id,
            to_location_id: rmStore.id,

            required_date: new Date(required_date),
            status: "requested",
            created_by: user.id
        });
        if (!transferOrder) {
            return res.status(500).json({ success: false, code: 500, message: "Record creation failed!!!" });
        };

        transferOrder.transfer_no = generateNo("TO-WI-RM", transferOrder.id);
        await transferOrder.save();

        // Create Transfer Order Items
        for (const item of items) {
            const { raw_product_id = "", required_qty = "" } = item;

            const product = await Product.findByPk(Number(raw_product_id));
            if (!product) {
                return res.status(404).json({ success: false, code: 404, message: "product record not found!!!" });
            };

            await TransferOrderItem.create({
                transfer_order_id: transferOrder.id,
                product_id: product.id,
                requested_qty: required_qty
            });
        }

        res.status(201).json({ success: true, code: 201, message: "Transfer request created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, code: 500, message: error.message });
    }
});