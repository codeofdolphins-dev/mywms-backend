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
export const createIndent = asyncHandler(async (req, res) => {
    // console.log(req.body);
    // return

    /** root DB */
    const { rootSequelize, models } = await rootDB();
    const { BlanketOrder, BpoIndent, BpoIndentItem } = models;
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

        /******************** create SO record on vendor/supplier side *********************/
        const salesOrder = await createSO_SOItems(VendorModels, VendorTransaction, req.dbModels, req.body, purchaseOrder);


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

        for (const item of items) {
            const { bpo_item_id = "", release_qty = "", unit_price = "" } = item;
            if (!bpo_item_id) throw new Error("bpo_item_id must required!!!");

            await BpoIndentItem.create({
                indent_id: indent.id,
                bpo_item_id: Number(bpo_item_id),
                release_qty,
                unit_price,
                line_total: release_qty * unit_price
            }, { transaction: rootTransaction });
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




/******************** helper methods ********************/
/**
 * 
 * @param {object} buyerModels buyer model
 * @param {object} buyerTransaction buyer models transaction
 * @param {object} VendorModels vendor/supplier models
 * @returns buyer side vendor local data record
 */
async function createVendor(buyerModels, buyerTransaction, VendorModels) {

    const { User, BusinessNode, NodeDetails } = VendorModels;
    const { Vendor } = buyerModels;

    try {
        const vendorDetails = await User.findOne({
            where: { is_owner: true },
            attributes: ["email"],
            include: [
                {
                    model: BusinessNode,
                    as: "userBusinessNode",
                    through: {
                        attributes: [],
                    },
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails",
                        }
                    ]
                }
            ]
        });

        const formatedDetails = vendorDetails?.toJSON();
        const node = formatedDetails.userBusinessNode[0];

        const [vendor, created] = await Vendor.findOrCreate({
            where: {
                contact_email: formatedDetails.email,
                linked_business_node_id: node.id,
                is_active: true
            },
            defaults: {
                name: node.name,
                linked_business_node_id: node.id,
                contact_email: formatedDetails.email,
                contact_phone: formatedDetails.email,
                address: node.address,
            },
            transaction: buyerTransaction
        });

        if (!created) {
            console.log("❌ Skip creation!!! Vendor record already exists!!!");
        }

        return vendor;

    } catch (error) {
        throw error;
    }
}


/**
 * 
 * @param {object} models buyer model
 * @param {object} buyerTransaction buyer model transaction
 * @param {object} reqBody reques body
 * @param {integer} vendor_id vendor/supplier id
 * @param {integer} bpo_id Blanket Purchase Order id
 * @param {object} requisition requisition details
 * @returns purchase order record
 */
async function createPO_PoItems(buyerModels, buyerTransaction, req, vendor_id, bpo_id, requisition) {

    const { PurchasOrder, PurchaseOrderItem, User } = buyerModels;
    const { priority = "", required_by = "", target_store_id = "", grand_total = "", instructions = "", items = "" } = req.body;

    try {
        const purchaseOrder = await PurchasOrder.create({
            bpo_id: bpo_id,
            target_store_id: target_store_id,
            priority: priority.toLowerCase(),
            ...(required_by && { required_by: new Date(required_by) }),
            requisition_id: requisition.id,
            from_business_node_id: requisition.buyer_business_node_id,
            to_supplier_id: vendor_id,
            type: "bpo_release",
            created_by: req.user.id,
            grand_total,
            note: instructions
        }, { transaction: buyerTransaction });
        if (!purchaseOrder) throw new Error("Failed to create purchase order record!!!");

        purchaseOrder.po_no = generateNo("EX-PO", purchaseOrder.id);
        await purchaseOrder.save({ transaction: buyerTransaction });

        for (const item of items) {
            const { product = "", release_qty = "", unit_price = "", bpo_item_id = "", remaining_qty = "" } = item;
            if ([product, unit_price, release_qty, remaining_qty, bpo_item_id].some(i => i === "")) throw new Error("Required fields are missing in items array!!!");

            if (Number(remaining_qty) < Number(release_qty)) throw new Error("Request qty out of balance!!!");

            const purchaseOrderItem = PurchaseOrderItem.create({
                purchase_order_id: purchaseOrder.id,
                bpo_item_id: bpo_item_id,
                product_id: product.id,
                qty: release_qty,
                unit_price: unit_price,
                line_total: unit_price * release_qty,
            }, { transaction: buyerTransaction });
            if (!purchaseOrderItem) throw new Error("Failed to create purchase order item record!!!");
        }

        return purchaseOrder;
    } catch (error) {
        throw error;
    }
}


/**
 * 
 * @param {object} VendorModels vendor/supplier models
 * @param {object} VendorTransaction vendor/supplier transaction
 * @param {object} BuyerModels buyer models
 * @param {object} reqBody reques body
 * @param {object} purchaseOrder buyer PO record
 * @returns salse order record
 */
async function createSO_SOItems(VendorModels, VendorTransaction, BuyerModels, reqBody, purchaseOrder) {
    const { SalesOrder, SalesOrderItem } = VendorModels;
    const { grand_total, instructions, priority, required_by, items } = reqBody;

    const { ManufacturingUnit } = BuyerModels;

    try {

        const manufacturingUnit = await ManufacturingUnit.findByPk(Number(purchaseOrder.target_store_id));
        if (!manufacturingUnit) throw new Error("Target store not found!!!");


        const salesOrder = await SalesOrder.create({
            source_po_no: purchaseOrder.po_no,
            central_bpo_id: purchaseOrder.bpo_id,
            buyer_business_node_id: purchaseOrder.from_business_node_id,
            priority: priority,
            ...(required_by && { required_by: new Date(required_by) }),
            delivery_address: {
                ...manufacturingUnit.address,
                store_name: manufacturingUnit.name,
                location: manufacturingUnit.location
            },
            type: "external",
            grand_total,
            note: instructions
        }, { transaction: VendorTransaction });

        salesOrder.so_no = generateNo("EX-SO", salesOrder.id);
        await salesOrder.save({ transaction: VendorTransaction });

        for (const item of items) {
            const { product = "", release_qty = "", unit_price = "" } = item;

            await SalesOrderItem.create({
                sales_order_id: salesOrder.id,
                product,
                qty: release_qty,
                unit_price,
                line_total: release_qty * unit_price,
            }, { transaction: VendorTransaction })
        }

        return salesOrder;

    } catch (error) {
        throw error;
    }
}