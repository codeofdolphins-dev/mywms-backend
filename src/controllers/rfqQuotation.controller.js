import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rootDB } from "../db/tenantMenager.service.js"
import { fetchNodeDetails } from "../helper/helper.js";


// GET
export const allRfqQuotationList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RFQ, RFQItem, RfqQuotation, RfqQuotationRevision, RfqQuotationItem, TenantsName, Tenant } = models;

    const dbName = req.headers["x-tenant-id"];

    try {
        let { page = 1, limit = 10, id = "", rfq_no = "", revision_no = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let rfq_id = null;
        if (rfq_no) {
            const rfq = await RFQ.findOne({
                where: { rfq_no }
            });
            rfq_id = rfq.id;
        }

        const rfqQuotation = await RfqQuotation.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(rfq_no && { rfq_id }),
                vendor_tenant: dbName,
            },
            include: [
                {
                    model: RFQ,
                    as: "linkedRfq",
                    // attributes: ["rfq_no"]
                },
                {
                    model: RfqQuotationRevision,
                    as: "quotationRevision",
                    include: [
                        {
                            model: RfqQuotationItem,
                            as: "revisionItems",
                            attributes: {
                                exclude: ["quotation_id", "qty"]
                            },
                            include: [
                                {
                                    model: RFQItem,
                                    as: "sourceRfqItem"
                                }
                            ]
                        }
                    ]
                },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
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
// {
//     model: TenantsName,
//     as: "vendorTenant",
//     attributes: ["id"],
//     include: [
//         {
//             model: Tenant,
//             as: "tenantDetails",
//             attributes: ["companyName"]
//         }
//     ]
// },
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
    const { RFQ, RfqQuotation, RfqQuotationRevision, RfqQuotationItem, RFQItem, TenantsName, Tenant } = models;

    try {
        const { page = 1, limit = 10, reqNo, targetVendor, targetRevision, } = req.query;

        // 1. Get the RFQ Header
        const rfq = await RFQ.findOne({ where: { pr_reference_code: reqNo } });
        if (!rfq) return res.status(404).json({ success: false, code: 404, message: "RFQ not found" });

        // 2. Get all Vendor Headers for this RFQ
        const vendorHeaders = await RfqQuotation.findAll({
            where: { rfq_id: rfq.id },
            include: [
                {
                    model: TenantsName,
                    as: "vendorTenant",
                    attributes: ["id"],
                    include: [
                        {
                            model: Tenant,
                            as: "tenantDetails",
                            attributes: ["companyName"]
                        }
                    ]
                },
            ] // include company names, etc.
        });

        // 3. Process each vendor's revision and items
        const data = await Promise.all(vendorHeaders.map(async (header) => {
            console.log(header.toJSON())
            const isTarget = targetVendor && String(header.vendor_tenant) === String(targetVendor);

            // Determine which revision to show: 
            // If it's the target vendor, use targetRevision. Otherwise, use their latest (current_revision_no).
            const revToFetch = isTarget && targetRevision ? targetRevision : header.current_revision_no;

            // Fetch the specific Revision record
            const revisionRecord = await RfqQuotationRevision.findOne({
                where: {
                    quotation_id: header.id,
                    revision_no: revToFetch
                }
            });

            if (!revisionRecord) return { ...header.toJSON(), revision: null, items: [] };

            // Fetch Items for this specific revision with CONDITIONAL pagination
            const items = await RfqQuotationItem.findAndCountAll({
                where: { revision_id: revisionRecord.id },
                include: [{ model: RFQItem, as: "sourceRfqItem" }],
                limit: isTarget ? parseInt(limit) : undefined,
                offset: isTarget ? (parseInt(page) - 1) * parseInt(limit) : undefined,
                order: [['createdAt', 'ASC']]
            });

            return {
                ...header.toJSON(),
                activeRevision: revisionRecord,
                requisition: rfq,
                quotationItems: items.rows,
                pagination: {
                    totalItems: items.count,
                    currentPage: isTarget ? parseInt(page) : 1,
                    totalPages: isTarget ? Math.ceil(items.count / limit) : 1,
                    isPaginated: isTarget
                }
            };
        }));

        return res.status(200).json({ success: true, code: 200, data: data });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message });
    }
};




// POST
export const createRfqQuotation = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();

    const { RFQ, RFQItem, RfqQuotation, RfqQuotationRevision, RfqQuotationItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    const dbName = req.headers["x-tenant-id"];
    const current_node = req.activeNode;

    try {
        const { rfq_no = "", valid_till = "", grandTotal = "", buyer_name = "", items = "" } = req.body;
        if (!rfq_no || items?.length < 1) throw new Error("Required fields are missing!!!");

        const rfq = await RFQ.findOne({ where: { rfq_no } });
        if (!rfq) throw new Error("RFQ record not found!!!");


        //  check record already exists or not
        const isExists = await RfqQuotation.findOne({
            where: {
                rfq_id: rfq.id,
                vendor_tenant: dbName
            }
        });
        if (isExists) {
            await rootTransaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: "Record already created!!!" });
        }

        const nodeDetails = await fetchNodeDetails(req.dbModels, current_node);

        const rfqQuotation = await RfqQuotation.create({
            rfq_id: rfq.id,
            vendor_tenant: dbName,
            buyer_name: buyer_name?.trim() ?? "",
            ...(valid_till && { valid_till: new Date(valid_till) }),
            meta: nodeDetails,
        }, { transaction: rootTransaction });

        const revision = await RfqQuotationRevision.create({
            quotation_id: rfqQuotation.id,
            grand_total: Number(grandTotal),
        }, { transaction: rootTransaction });


        for (const item of items) {
            const { id = "", offer_price = "", qty = "" } = item;
            if (!id || !offer_price) throw new Error("Required fields are missing in items array!!!");

            const rfqItem = await RFQItem.findByPk(Number(id));
            if (!rfqItem) throw new Error("RFQ items record not found!!!");

            await RfqQuotationItem.create({
                revision_id: revision.id,
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