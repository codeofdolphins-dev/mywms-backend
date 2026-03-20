import { Op } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getTenantConnection, rootDB } from "../../db/tenantMenager.service.js";
import { generateNo } from "../../helper/generate.js";


// GET
const allBlanketOrderList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { BlanketOrder, BlanketOrderItem, TenantsName, Tenant } = models;

    const dbName = req.headers["x-tenant-id"];

    try {
        let { page = 1, limit = 10, id = "", bpo_no = "", status = "all", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const blanketOrder = await BlanketOrder.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(bpo_no && { bpo_no: bpo_no.trim() }),
                [Op.or]: [
                    { buyer_tenant: dbName },
                    { vendor_tenant: dbName }
                ],
                ...(status !== "all" && { status: status.toLowerCase() }),
            },
            include: [
                {
                    model: BlanketOrderItem,
                    as: "blanketOrderItems",
                },
                {
                    model: TenantsName,
                    as: "buyer",
                    include: [
                        {
                            model: Tenant,
                            as: "tenantDetails",
                            // attributes: ["companyName"]
                        }
                    ]
                },
                {
                    model: TenantsName,
                    as: "vendor",
                    include: [
                        {
                            model: Tenant,
                            as: "tenantDetails",
                            // attributes: ["companyName"]
                        }
                    ]
                },
            ],
            limit,
            offset,
            ...(!noLimit && { order: [['createdAt', 'DESC']] })
        });
        if (!blanketOrder) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = blanketOrder.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: (id || bpo_no || noLimit) ? blanketOrder?.rows?.[0] : blanketOrder?.rows,
            ...(!(id || bpo_no || noLimit) && {
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

// GET
const blanketOrderWithProductDetails = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { BlanketOrder, BlanketOrderItem } = models;
    const { Product } = req.dbModels;

    try {
        const { bpo_no } = req.params;
        if (!bpo_no) throw new Error("bpo_no is required");

        const blanketOrders = await BlanketOrder.findOne({
            where: { bpo_no: bpo_no.trim() },
            include: [
                {
                    model: BlanketOrderItem,
                    as: "blanketOrderItems",
                }
            ],
        });
        if (!blanketOrders || blanketOrders.length === 0) return res.status(404).json({ success: false, code: 404, message: "Blanket Order not found" });

        const productIds = blanketOrders?.blanketOrderItems?.flatMap(item => item.buyer_product_id);

        if (productIds.length === 0) {
            return res.status(200).json({
                success: true,
                code: 200,
                message: "Fetched Successfully.",
                data: blanketOrders,
            });
        }

        const products = await Product.findAll({
            where: { id: { [Op.in]: [...new Set(productIds)] } },
            attributes: ["id", "name", "sku", "unit_type", "photo"]
        });

        const productMap = new Map(products.map(p => [p.id, p.toJSON()]));

        const orderJson = blanketOrders.toJSON();
        orderJson.blanketOrderItems = orderJson.blanketOrderItems.map(item => ({ ...item, product: productMap.get(item.buyer_product_id) || null }));

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: orderJson,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
const createIndent = asyncHandler(async (req, res) => {
    // console.log(req.body); return

    /** root DB */
    const { rootSequelize, models } = await rootDB();
    const { BlanketOrder, BlanketOrderItem, RfqQuotationRevision } = models;
    const rootTransaction = await rootSequelize.transaction();


    /** buyer DB */
    const { Vendor, PurchasOrder, PurchaseOrderItem, ManufacturingUnit, Requisition } = req.dbModels;
    const buyerTransaction = await req.dbObject.transaction();

    /** supplier DB */
    let vendorTransaction = null;

    try {
        const { bpo_no = "", priority = "", required_by = "", target_store_id = "", items = "" } = req.body;
        if ([bpo_no, target_store_id, items].some(i => i === "")) throw new Error("Required fields are missing!!!");

        const blanketOrder = await BlanketOrder.findOne({ where: { bpo_no: bpo_no.trim() } });
        if (!blanketOrder) throw new Error("Record not found!!!");

        const store = await ManufacturingUnit.findByPk(Number(target_store_id));
        if (!store) throw new Error("Store not found!!!");

        
        const requisition_no = blanketOrder.pr_reference_code;

        const requisition = await Requisition.findOne({ where: { requisition_no } });
        if (!requisition) throw new Error("Requisition record not found!!!");


        const vendorTenant = blanketOrder.vendor_tenant;
        if (!vendorTenant) throw new Error("Vendor tenant not found in blanket order record!!!");
        
        /** get vendor database connection */
        const { sequelize, models: vendorModel } = getTenantConnection(vendorTenant);
        vendorTransaction = await sequelize.transaction();
        const { SalesOrder, SalesOrderItem } = vendorModel;


        const purchaseOrder = await PurchasOrder.create({
            bpo_id: blanketOrder.id,
            target_store_id: target_store_id,
            priority: priority.toLowerCase(),
            ...(required_by && { required_by: new Date(required_by) }),
            requisition_id: requisition.id,
            from_business_node_id: requisition.buyer_business_node_id,
            type: "bpo_release",
            created_by: req.user.id,
        }, { transaction: buyerTransaction });



    } catch (error) {
        await rootTransaction.rollback();
        await buyerTransaction.rollback();
        if (!vendorTransaction) await vendorTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// DELETE
const deleteBlanketOrder = asyncHandler(async (req, res) => {
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


// PUT
const updateBlanketOrder = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();

    const { RFQItem, RfqQuotation, RfqQuotationRevision, RfqQuotationItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    try {
        const { quotation_id = "", grandTotal = "", items = "" } = req.body;
        if (!quotation_id || items?.length < 1) throw new Error("Required fields are missing!!!");

        const quotation = await RfqQuotation.findByPk(Number(quotation_id));
        if (!quotation) {
            await rootTransaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Quotation record not found!!!" });
        }

        const current_revision_no = quotation.current_revision_no;
        if (current_revision_no >= 3) {
            await rootTransaction.rollback();
            return res.status(405).json({ success: false, code: 405, message: "Cannot update this quotation!!!" });
        };

        quotation.current_revision_no = current_revision_no + 1;
        await quotation.save({ transaction: rootTransaction });

        const revision = await RfqQuotationRevision.create({
            quotation_id: quotation.id,
            grand_total: Number(grandTotal),
            revision_no: current_revision_no + 1,
        }, { transaction: rootTransaction });


        for (const item of items) {
            const { rfq_item_id = "", offer_price = "", qty = "" } = item;
            if (!rfq_item_id || !offer_price) throw new Error("Required fields are missing in items array!!!");

            const rfqItem = await RFQItem.findByPk(Number(rfq_item_id));
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