import { Op } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { rootDB } from "../../db/tenantMenager.service.js"


// GET
export const allRfqList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RFQ, RFQItem, ProductMapping, Connection } = models;

    const vendor_tenant = req.headers["x-tenant-id"];
    // console.log(dbName)

    try {
        let { page = 1, limit = 10, id = "", rfq_no = "", location = "", company = "", status = "", priority = "all" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const rfq = await RFQ.findAndCountAll({
            distinct: true,
            where: {
                ...(id && { id: Number(id) }),
                ...(priority?.toLowerCase().trim() !== "all" && { priority: priority?.toLowerCase().trim() }),
                ...(rfq_no?.trim() && { rfq_no: { [Op.iLike]: `%${rfq_no?.trim()}%` } }),
                ...(status !== "" && { status: status?.toLowerCase().trim() }),
                ...(company?.trim() && { "meta.name": { [Op.iLike]: `%${company.trim()}%` } }),
                ...(location?.trim() && { "meta.nodeDetails.location": { [Op.iLike]: `%${location.trim()}%` } }),
            },
            include: [
                {
                    model: RFQItem,
                    as: "items",
                },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });
        if (!rfq) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        /** attaching vendor product id */
        const formattedRows = await Promise.all(rfq.rows.map(async (item) => {
            const formatJSON = item.toJSON();
            // console.log(formatJSON)

            const buyer_tenant = formatJSON.buyer_tenant;
            let connection = null;
            if (vendor_tenant) {
                connection = await Connection.findOne({
                    where: {
                        buyer_tenant,
                        vendor_tenant,
                        connection_type: "supplier",
                    }
                });
            }
            formatJSON.connection = connection;

            // for (const product of formatJSON.items) {
            //     if (vendor_tenant) {
            //         const productMapping = await ProductMapping.findOne({
            //             where: {
            //                 buyer_node: buyer_tenant,
            //                 vendor_node: vendor_tenant,
            //                 buyer_product_id: product.product_id,
            //             },
            //         });
            //         if (req?.dbModels) {
            //             const { Product } = req.dbModels;
            //             product.vendor_product = await Product.findOne({
            //                 where: {
            //                     id: Number(productMapping?.vendor_product_id || 0),
            //                 },
            //             });
            //         }
            //     }
            // }

            return formatJSON;
        }));


        /** pagination calculation */
        const totalItems = rfq.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: formattedRows,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
/** create Requesition(EX) == RFQ */


// DELETE
const deleteRequisition = asyncHandler(async (req, res) => {
    const { Requisition } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await Requisition.destroy({
            where: { id: parseInt(id, 10) },
        });
        if (!isDeleted) return res.status(503).json({ success: false, code: 503, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


const updateRequisition = asyncHandler(async (req, res) => {
    const { Requisition } = req.dbModels;
    try {
        const {
            id = "",
            title = "",
            status = "",
            priority = "",
            notes = "",
        } = req.body;

        const requisition = await Requisition.findByPk(parseInt(id, 10));
        if (!requisition)
            return res.status(404).json({
                success: false,
                code: 404,
                message: "No requisition record found!!!",
            });

        const currentStatus = requisition.status;

        if (["draft", "submitted"].some((item) => item === currentStatus)) {
            let updateDetails = {};
            if (title) updateDetails.title = title;
            if (status) updateDetails.status = status;
            if (priority) updateDetails.priority = priority;
            if (notes) updateDetails.notes = notes;

            const isUpdate = await Requisition.update(updateDetails, {
                where: { id },
            });
            if (!isUpdate)
                return res.status(503).json({
                    success: false,
                    code: 503,
                    message: "Updation failed!!!",
                });

            return res.status(200).json({
                success: true,
                code: 200,
                message: "Updated Successfully.",
            });
        }
        return res.status(422).json({
            success: false,
            code: 422,
            message: "Updation not possible!!!",
        });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, code: 500, message: error.message });
    }
});