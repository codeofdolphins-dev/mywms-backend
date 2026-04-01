import { generateNo } from "../helper/generate.js";

/**
 * 
 * @param {object} buyerModels buyer/vendor models
 * @param {object} buyerTransaction buyer/vendor models transaction
 * @param {object} VendorModels vendor/buyer models
 * @param {string} type when passed "buyer" then create buyer record on vendor side
 * @returns buyer side vendor local data record
 */
export async function createVendor(buyerModels, buyerTransaction, VendorModels, type = "") {

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
                ...(type && { type }),
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
export async function createPO_PoItems(buyerModels, buyerTransaction, req, vendor_id, bpo_id, requisition) {

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
            status: "waiting_for_poi",
            created_by: req.user.id,
            grand_total,
            note: instructions
        }, { transaction: buyerTransaction });
        if (!purchaseOrder) throw new Error("Failed to create purchase order record!!!");

        purchaseOrder.po_no = generateNo("EX-PO", purchaseOrder.id);
        await purchaseOrder.save({ transaction: buyerTransaction });

        for (const item of items) {
            const { buyer_product_id = "", release_qty = "", unit_price = "", bpo_item_id = "", remaining_qty = "" } = item;
            if ([buyer_product_id, unit_price, release_qty, remaining_qty, bpo_item_id].some(i => i === "")) throw new Error("Required fields are missing in items array!!!");

            if (Number(remaining_qty) < Number(release_qty)) throw new Error("Request qty out of balance!!!");

            const purchaseOrderItem = PurchaseOrderItem.create({
                purchase_order_id: purchaseOrder.id,
                bpo_item_id: bpo_item_id,
                buyer_product_id: Number(buyer_product_id),
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
export async function createSO_SOItems(VendorModels, VendorTransaction, BuyerModels, reqBody, purchaseOrder, seller, buyer) {
    const { SalesOrder, SalesOrderItem } = VendorModels;
    const { grand_total, instructions, priority, required_by, items } = reqBody;

    const { ManufacturingUnit } = BuyerModels;

    try {

        const manufacturingUnit = await ManufacturingUnit.findByPk(Number(purchaseOrder.target_store_id));
        if (!manufacturingUnit) throw new Error("Target store not found!!!");


        const salesOrder = await SalesOrder.create({
            source_po_no: purchaseOrder.po_no,
            central_bpo_id: purchaseOrder.bpo_id,
            priority: priority,

            seller_business_node_id: seller.linked_business_node_id,
            buyer_business_node_id: buyer.id,

            ...(required_by && { required_by: new Date(required_by) }),
            delivery_address: {
                ...manufacturingUnit.address,
                store_name: manufacturingUnit.name,
                location: manufacturingUnit.location
            },
            type: "external",
            status: "waiting_for_approval",
            grand_total,
            note: instructions
        }, { transaction: VendorTransaction });

        salesOrder.so_no = generateNo("EX-SO", salesOrder.id);
        await salesOrder.save({ transaction: VendorTransaction });

        for (const item of items) {
            const { vendor_product_id = "", release_qty = "", unit_price = "" } = item;

            await SalesOrderItem.create({
                sales_order_id: salesOrder.id,
                vendor_product_id: Number(vendor_product_id),
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