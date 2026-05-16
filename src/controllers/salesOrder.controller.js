import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET - All Sales Order List
export const allSalesOrderList = asyncHandler(async (req, res) => {
    const { SalesOrder, SalesOrderItem, BusinessNode, NodeDetails, Vendor } = req.dbModels;

    try {
        let { page = 1, limit = 10, soNo = "" } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const salesOrder = await SalesOrder.findAndCountAll({
            where: {
                ...(soNo?.trim() && { so_no: { [Op.iLike]: `${soNo?.trim()}%` } }),
            },
            distinct: true,
            include: [
                {
                    model: SalesOrderItem,
                    as: "salesOrderItems",
                },
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!salesOrder) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = salesOrder.count;
        const totalPages = Math.ceil(totalItems / limit);

        const rows = await Promise.all(salesOrder.rows.map(async so => {
            const soJson = so.toJSON();

            if (soJson.type === 'internal') {
                soJson.poBuyer = await BusinessNode.findOne({
                    where: { id: soJson.buyer_business_node_id },
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails"
                        }
                    ]
                })
            } else if (soJson.type === 'external') {
                soJson.poBuyer = await Vendor.findOne({
                    where: { id: soJson.buyer_business_node_id }
                })
            }
            return soJson;
        }));

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: rows,
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

// GET - Sales Order Item Details
export const salesOrderItemDetails = asyncHandler(async (req, res) => {
    const { SalesOrder, SalesOrderItem, BusinessNode, NodeDetails, Vendor, Product, Brand, Category } = req.dbModels;

    try {
        let { page = 1, limit = 10, soNo = "", noLimit = false } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const salesOrder = await SalesOrder.findOne({
            where: {
                so_no: {
                    [Op.iLike]: soNo?.trim()
                }
            },
        });
        if (!salesOrder) throw new Error("Record not found!!!");

        const soJson = salesOrder.toJSON();

        // console.log(soJson)

        if (soJson.type === 'internal') {
            soJson.soBuyer = await BusinessNode.findOne({
                where: { id: soJson.buyer_business_node_id },
                include: [
                    {
                        model: NodeDetails,
                        as: "nodeDetails"
                    }
                ]
            });
        } else if (soJson.type === 'external') {
            soJson.soBuyer = await Vendor.findOne({
                where: { id: soJson.buyer_business_node_id }
            });
        }

        const { rows, count } = await SalesOrderItem.findAndCountAll({
            where: {
                sales_order_id: salesOrder.id
            },
            ...(!noLimit && { limit, offset }),
            order: [["createdAt", "ASC"]],
            include: [
                {
                    model: Product,
                    as: "soi_product",
                    include: [
                        {
                            model: Brand,
                            as: "brand"
                        },
                        {
                            model: Category,
                            as: "productCategories",
                            through: { attributes: [] },
                            include: [
                                {
                                    model: Category,
                                    as: "subcategories",
                                },
                            ]
                        },
                    ]
                }
            ]
        });

        const totalItems = count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: {
                ...soJson,
                items: rows
            },
            ...(!noLimit && {
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit
                }
            })
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});
