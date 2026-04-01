import { Op, Sequelize } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getTenantConnection, rootDB } from "../../db/tenantMenager.service.js";
import { generateNo } from "../../helper/generate.js";
import { createPO_PoItems, createSO_SOItems, createVendor } from "../../services/indent.service.js";
import { updatePOStatus, updateSOStatus } from "../../services/updateStatus.service.js";


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
export const createIndent = asyncHandler(async (req, res) => {
    // console.log(req.body);
    // return

    /** root DB */
    const { rootSequelize, models } = await rootDB();
    const { BlanketOrder, BlanketOrderItem, BpoIndent, BpoIndentItem } = models;
    const rootTransaction = await rootSequelize.transaction();


    /** buyer DB */
    const { ManufacturingUnit, Requisition } = req.dbModels;
    const buyerTransaction = await req.dbObject.transaction();

    /** supplier DB */
    let VendorTransaction = null;

    try {
        const { bpo_no = "", target_store_id = "", grand_total = "", items = "" } = req.body;
        if ([bpo_no, target_store_id, items].some(i => i === "")) throw new Error("Required fields are missing!!!");

        const blanketOrder = await BlanketOrder.findOne({ where: { bpo_no: bpo_no.trim() } });
        if (!blanketOrder) throw new Error("Record not found!!!");

        /******************** Verify Store record *********************/
        const store = await ManufacturingUnit.findByPk(Number(target_store_id));
        if (!store) throw new Error("Store not found!!!");


        /******************** Verify Requisition *********************/
        const requisition_no = blanketOrder.pr_reference_code;
        const requisition = await Requisition.findOne({ where: { requisition_no } });
        if (!requisition) throw new Error("Requisition record not found!!!");


        /******************** Verify Vendor Tenant *********************/
        const vendorTenant = blanketOrder.vendor_tenant;
        if (!vendorTenant) throw new Error("Vendor tenant not found in blanket order record!!!");

        /** get vendor database connection */
        const { sequelize, models: VendorModels } = await getTenantConnection(vendorTenant);
        VendorTransaction = await sequelize.transaction();



        /******************** create vendor record on buyer side *********************/
        const vendor = await createVendor(req.dbModels, buyerTransaction, VendorModels);

        /******************** create PO record on buyer side *********************/
        const purchaseOrder = await createPO_PoItems(req.dbModels, buyerTransaction, req, vendor.id, blanketOrder.id, requisition);


        /******************** create buyer record on vendor side *********************/
        const buyer = await createVendor(VendorModels, VendorTransaction, req.dbModels, "buyer");

        /******************** create SO record on vendor/supplier side *********************/
        const salesOrder = await createSO_SOItems(VendorModels, VendorTransaction, req.dbModels, req.body, purchaseOrder, vendor, buyer);


        const indent = await BpoIndent.create({
            bpo_id: blanketOrder.id,
            buyer_tenant: blanketOrder.buyer_tenant,
            vendor_tenant: blanketOrder.vendor_tenant,
            buyer_po_id: purchaseOrder.id,
            supplier_so_id: salesOrder.id,
            created_by: req.user.id,
            grand_total: Number(grand_total),
        }, { transaction: rootTransaction });

        indent.indent_no = generateNo("EX-Indent", indent.id);
        await indent.save({ transaction: rootTransaction });

        /** create indent items and update blanket order items */
        for (const item of items) {
            const { bpo_item_id = "", release_qty = "", unit_price = "" } = item;
            if (!bpo_item_id) throw new Error("bpo_item_id must required!!!");

            const blanketOrderItem = await BlanketOrderItem.findByPk(Number(bpo_item_id));
            if (!blanketOrderItem) throw new Error("Blanket order item not found!!!");

            /** create indent items */
            await BpoIndentItem.create({
                indent_id: indent.id,
                bpo_item_id: Number(bpo_item_id),
                release_qty,
                unit_price,
                line_total: release_qty * unit_price
            }, { transaction: rootTransaction });

            /** update blanket order items */
            await BlanketOrderItem.update({
                unsettled_qty: Sequelize.literal(`unsettled_qty + ${release_qty}`),
                remain_contracted_qty: Sequelize.literal(`remain_contracted_qty - ${release_qty}`)
            }, { where: { id: Number(bpo_item_id) }, transaction: rootTransaction });
        };


        await rootTransaction.commit();
        await buyerTransaction.commit();
        if (VendorTransaction) await VendorTransaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Indent record created" });

    } catch (error) {
        await rootTransaction.rollback();
        await buyerTransaction.rollback();
        if (VendorTransaction) await VendorTransaction?.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


/** this will update status of PO and SO via indent */
export const updateStatusViaIndent = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { BpoIndent } = models;
    try {
        const { bpo_id = "", po_id = "", status = "" } = req.body;
        if (!bpo_id || !po_id || !status) throw new Error("Required fields are missing!!!");

        const indent = await BpoIndent.findOne({
            where: {
                bpo_id: Number(bpo_id),
                buyer_po_id: Number(po_id)
            }
        });
        if (!indent) throw new Error("Indent record not found!!!");

        await updatePOStatus(indent, status);
        await updateSOStatus(indent, status);

        return res.status(200).json({ success: true, code: 200, message: "Status updated successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
})