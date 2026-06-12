import { rootDB } from "../db/tenantMenager.service.js";
import { generateNo } from "../helper/generate.js";

export async function createInvoice(req, outward, salesOrder, allocatedItems, transaction) {
    const { models } = await rootDB();

    const { Invoice, InvoiceItems, Product, HSN } = req.dbModels;

    try {
        const indent = await models.BpoIndent.findOne({
            where: { id: salesOrder.central_indent_id },
            include: [
                {
                    model: models.BpoIndentItem,
                    as: "bpoIndentItem",
                    include: [
                        {
                            model: models.BlanketOrderItem,
                            as: "parentBlanketOrderItem",
                            attributes: ["buyer_product_id", "vendor_product_id"]
                        }
                    ]
                }
            ]
        });
        if (!indent) throw new Error("Indent not found!!!");

        // const invoice = await Invoice.create({
        //     seller_tenant: indent.vendor_tenant,
        //     seller_businessNode_id: outward.seller_business_node_id,
        //     seller_store_id: outward.store_id,
        //     buyer_tenant: indent.buyer_tenant,
        //     buyer_businessNode_id: outward.buyer_business_node_id,
        //     outward_id: outward.id,
        //     invoice_date: new Date(),

        //     sub_total,
        //     total_tax_amount,
        //     discount,
        //     grand_total
        // }, { transaction })
        // const invNo = generateNo("INV", invoice.id);


        // create invoice items

        for (const a of indent.bpoIndentItem) {
            // console.log("indentItem", a.toJSON());
        }

        for (const item of allocatedItems) {
            // console.log("allocatedItems", item);
            const { vendor_product_id, requested_qty, allocated_batches } = item;
            const vendorProduct = await Product.findByPk(
                Number(vendor_product_id), {
                attributes: ["id", "name", "hsn_code", "sku", "barcode"],
                include: [
                    { model: HSN, as: "hsn" }
                ]
            });
            console.log("vendorProduct", vendorProduct.toJSON());

            const productIds = indent.bpoIndentItem.find(i => i.parentBlanketOrderItem.vendor_product_id === vendor_product_id).parentBlanketOrderItem;

        }


    } catch (error) {
        console.log(error);
        throw error;
    }
};