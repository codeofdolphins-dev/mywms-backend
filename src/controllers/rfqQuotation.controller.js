import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rootDB } from "../db/tenantMenager.service.js"
import { fetchNodeDetails } from "../helper/helper.js";


// GET
export const allRfqQuotationList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RFQ, RFQItem, RfqQuotation, RfqQuotationItem, TenantsName, Tenant } = models;

    const dbName = req.headers["x-tenant-id"];

    try {
        let { page = 1, limit = 10, id = "", rfq_no = "", reqNo = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let rfq_id = null;
        if (rfq_no) {
            const rfq = await RFQ.findOne({
                where: {
                    [Op.or]: [{ rfq_no }, { pr_reference_code: reqNo.trim() }]
                }
            });
            rfq_id = rfq.id;
        }

        const rfqQuotation = await RfqQuotation.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(rfq_no && { rfq_id }),
                ...(!reqNo && { vendor_tenant: dbName }),
            },
            include: [
                {
                    model: RFQ,
                    as: "linkedRfq",
                    // attributes: ["rfq_no"]
                },
                {
                    model: RfqQuotationItem,
                    as: "quotationItems",
                    attributes: {
                        exclude: ["quotation_id", "qty"]
                    },
                    include: [
                        {
                            model: RFQItem,
                            as: "sourceRfqItem"
                        }
                    ]
                },
                ...(reqNo && [{
                    model: TenantsName,
                    as: "vendorTenant",
                    attributes: ["id"],
                    include: [
                        {
                            model: Tenant,
                            as: "tenantDetails",
                            attributes: ["companyName"],
                        }
                    ]
                }])
            ],
            limit,
            offset,
            order: [["createdAt", reqNo ? "ASC" : "DESC"]],
        });
        if (!rfqQuotation) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = rfqQuotation.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: (!rfq_no || !id) ? rfqQuotation?.rows : rfqQuotation?.rows?.[0],
            ...((!rfq_no || !id) && {
                meta: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            }),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// export const getQuotationWithPaginatedItems = async (req, res) => {
//     const { models } = await rootDB();
//     const { RFQ, RFQItem, RfqQuotation, RfqQuotationItem, TenantsName, Tenant } = models;

//     try {
//         let { page = 1, limit = 10, reqNo = "", revision = 1 } = req.query;

//         page = parseInt(page);
//         limit = parseInt(limit);
//         revision = parseInt(revision);

//         const offset = (page - 1) * limit;

//         if (!reqNo) throw new Error("reqNo required");


//         // 1️⃣ Find RFQ
//         const rfq = await RFQ.findOne({
//             where: { pr_reference_code: reqNo.trim() }
//         });

//         if (!rfq) {
//             return res.status(404).json({
//                 success: false,
//                 message: "RFQ not found"
//             });
//         }

//         // 2️⃣ Get all vendor quotations for that revision
//         const quotations = await RfqQuotation.findAll({
//             where: {
//                 rfq_id: rfq.id,
//                 revision_no: revision
//             },
//             include: [
//                 {
//                     model: TenantsName,
//                     as: "vendorTenant",
//                     attributes: ["id"],
//                     include: [
//                         {
//                             model: Tenant,
//                             as: "tenantDetails",
//                             attributes: ["companyName"]
//                         }
//                     ]
//                 },
//                 {
//                     model: RFQ,
//                     as: "linkedRfq",
//                 },
//             ],
//             order: [["createdAt", "DESC"]]
//         });

//         // 3️⃣ Attach paginated items for each quotation
//         const result = await Promise.all(
//             quotations.map(async (quotation) => {

//                 const items = await RfqQuotationItem.findAndCountAll({
//                     where: {
//                         quotation_id: quotation.id
//                     },
//                     attributes: {
//                         exclude: ["quotation_id", "qty"]
//                     },
//                     include: [
//                         {
//                             model: RFQItem,
//                             as: "sourceRfqItem"
//                         }
//                     ],
//                     limit,
//                     offset,
//                     order: [["createdAt", "ASC"]]
//                 });

//                 return {
//                     ...quotation.toJSON(),
//                     quotationItems: items.rows,
//                     itemsMeta: {
//                         totalItems: items.count,
//                         totalPages: Math.ceil(items.count / limit),
//                         currentPage: page,
//                         limit
//                     }
//                 };
//             })
//         );

//         return res.status(200).json({
//             success: true,
//             message: "Fetched successfully",
//             data: result
//         });

//     } catch (error) {
//         console.error(error);

//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };



export const getQuotationWithPaginatedItems = async (req, res) => {
    const { models } = await rootDB();
    const { RFQ, RFQItem, RfqQuotation, RfqQuotationItem, TenantsName, Tenant } = models;

    try {
        const {
            reqNo,
            baseRevision = 1,
            targetVendorId, // This should match the 'vendor_tenant' string (e.g., "mywms")
            targetRevision,
            page = 1,
            limit = 10
        } = req.query;

        if (!reqNo) return res.status(400).json({ success: false, message: "reqNo is required" });

        // 1. Find RFQ by pr_reference_code
        const rfq = await RFQ.findOne({
            where: { pr_reference_code: reqNo.trim() }
        });

        if (!rfq) return res.status(404).json({ success: false, message: "RFQ not found" });

        // 2. Fetch Quotations with logic to handle the target vendor override
        const quotations = await RfqQuotation.findAll({
            where: {
                rfq_id: rfq.id,
                [Op.or]: [
                    {
                        // Set everyone to base revision
                        revision_no: parseInt(baseRevision),
                        // EXCEPT the vendor we are specifically targeting for a different revision
                        ...(targetVendorId && targetRevision && {
                            vendor_tenant: { [Op.ne]: targetVendorId }
                        })
                    },
                    ...(targetVendorId ? [{
                        // Explicitly fetch the target vendor's requested revision
                        vendor_tenant: targetVendorId,
                        revision_no: parseInt(targetRevision || baseRevision)
                    }] : [])
                ]
            },
            include: [{
                model: TenantsName,
                as: "vendorTenant",
                include: [{ model: Tenant, as: "tenantDetails", attributes: ["companyName"] }]
            }],
            order: [["createdAt", "DESC"]]
        });

        // 3. Process items and apply pagination ONLY to the target vendor
        const data = await Promise.all(quotations.map(async (quotation) => {
            // Compare against 'vendor_tenant' column as per your schema
            const isTarget = targetVendorId && String(quotation.vendor_tenant) === String(targetVendorId);

            const pPage = parseInt(page);
            const pLimit = parseInt(limit);
            const offset = (pPage - 1) * pLimit;

            const items = await RfqQuotationItem.findAndCountAll({
                where: { quotation_id: quotation.id },
                include: [{ model: RFQItem, as: "sourceRfqItem" }],
                attributes: { exclude: ["quotation_id"] },
                // Pagination applied only if it's the target
                limit: isTarget ? pLimit : undefined,
                offset: isTarget ? offset : undefined,
                order: [["createdAt", "ASC"]]
            });

            return {
                ...quotation.toJSON(),
                quotationItems: items.rows,
                pagination: {
                    totalItems: items.count,
                    currentPage: isTarget ? pPage : 1,
                    totalPages: isTarget ? Math.ceil(items.count / pLimit) : 1,
                    isPaginated: isTarget,
                    activeRevision: quotation.revision_no
                }
            };
        }));

        return res.status(200).json({ success: true, data });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};




// POST
export const createRfqQuotation = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();

    const { RFQ, RFQItem, RfqQuotation, RfqQuotationItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    const dbName = req.headers["x-tenant-id"];
    const current_node = req.activeNode;

    try {
        const { rfq_no = "", valid_till = "", grandTotal = "", buyer_name = "", items = "" } = req.body;
        if (!rfq_no || items?.length < 1) throw new Error("Required fields are missing!!!");

        const rfq = await RFQ.findOne({ where: { rfq_no } });
        if (!rfq) throw new Error("RFQ record not found!!!");

        const isExists = await RfqQuotation.findOne({
            where: {
                rfq_id: rfq.id,
                vendor_tenant: dbName
            }
        });
        if (isExists) throw new Error("Record already created!!!");

        const nodeDetails = await fetchNodeDetails(req.dbModels, current_node);
        console.log(nodeDetails);

        const rfqQuotation = await RfqQuotation.create({
            rfq_id: rfq.id,
            vendor_tenant: dbName,
            buyer_name: buyer_name?.trim(),
            ...(valid_till && { valid_till: new Date(valid_till) }),
            grand_total: Number(grandTotal),
            meta: nodeDetails,
        }, { transaction: rootTransaction });


        for (const item of items) {
            const { id = "", offer_price = "", qty = "", line_total = "" } = item;
            if (!id || !offer_price) throw new Error("Required fields are missing in items array!!!");

            const rfqItem = await RFQItem.findByPk(Number(id));
            if (!rfqItem) throw new Error("RFQ items record not found!!!");

            await RfqQuotationItem.create({
                quotation_id: rfqQuotation.id,
                rfq_item_id: rfqItem.id,
                qty,
                offer_price,
            }, { transaction: rootTransaction });
        };

        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record created successfully" });

    } catch (error) {
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// DELETE
export const deleteRfqQuotation = asyncHandler(async (req, res) => {
    const { models } = await rootDB();

    const { RfqQuotation } = models;

    const dbName = req.headers["x-tenant-id"];

    try {
        const { id } = req.params;
        if (!id) throw new Error("Id is required!!!");

        const quotation = await RfqQuotation.findOne({ where: { id: parseInt(id, 10), vendor_tenant: dbName } });
        if (!quotation) return res.status(404).json({ success: false, code: 404, message: "No record found!!!" });

        const isDeleted = await RfqQuotation.destroy({
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
    const { rootSequelize, models } = await rootDB();

    const { RFQ, RFQItem, RfqQuotation, RfqQuotationItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    const dbName = req.headers["x-tenant-id"];

    try {
        const { id = "", valid_till = "", grandTotal = "", buyer_name = "", items = "" } = req.body;

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