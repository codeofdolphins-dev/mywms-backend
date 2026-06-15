import { getTenantConnection, rootDB } from "../db/tenantMenager.service.js";
import { generateNo } from "../helper/generate.js";

export async function createInvoice(req, outward, salesOrder, allocatedItems, transaction) {
    const { models } = await rootDB();

    const { Invoice, InvoiceItem } = req.dbModels;

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

        const { models: buyerModels } = await getTenantConnection(indent.buyer_tenant);

        const isIntra = await isIntraState(buyerModels, req.dbModels, indent);

        // create invoice header
        const invoice = await Invoice.create({
            seller_tenant: indent.vendor_tenant,
            seller_businessNode_id: outward.seller_business_node_id,
            seller_store_id: outward.store_id,
            buyer_tenant: indent.buyer_tenant,
            buyer_businessNode_id: outward.buyer_business_node_id,
            outward_id: outward.id,
            invoice_date: new Date()
        }, { transaction })
        const invNo = generateNo("INV", invoice.id);

        let header_sub_total = 0;
        let header_total_tax_amount = 0;
        let header_grand_total = 0;

        for (const item of allocatedItems) {
            const { vendor_product_id, requested_qty, allocated_batches } = item;
            const vendorProduct = await getProduct(req.dbModels, vendor_product_id);

            const indentItem = indent.bpoIndentItem.find(i => i.parentBlanketOrderItem.vendor_product_id === vendor_product_id);
            if (indentItem == undefined) throw new Error("No Product ID found for vendor_product_id");

            const buyerProduct = await getProduct(buyerModels, indentItem.parentBlanketOrderItem.buyer_product_id);

            const unitPrice = indentItem.unit_price;

            for (const batch of allocated_batches) {
                // console.log("batch", batch);
                const { batch_no, allocated_qty, expiry_date, mfg_date } = batch;

                const hsn = vendorProduct?.hsn;
                const isExempt = hsn?.is_exempt;

                // calculate invoice item totals
                const subTotal = Number(allocated_qty) * Number(unitPrice);
                const taxrate = Number(hsn?.default_gst_rate);
                const taxAmount = subTotal * (taxrate / 100);
                const grandTotal = subTotal + taxAmount;

                // add invoice header totals
                header_sub_total += subTotal;
                header_total_tax_amount += taxAmount;
                header_grand_total += grandTotal;

                // create invoice item
                await InvoiceItem.create({
                    invoice_id: invoice.id,
                    seller_product_id: vendorProduct.id,
                    seller_product_name: vendorProduct.name,
                    seller_product_sku: vendorProduct.sku,

                    buyer_product_id: buyerProduct.id,
                    buyer_product_name: buyerProduct.name,
                    buyer_product_sku: buyerProduct.sku,

                    hsn_code: vendorProduct.hsn_code,
                    batch_no: batch_no,
                    ...(mfg_date && { mfg_date: new Date(mfg_date) }),
                    ...(expiry_date && { expiry_date: new Date(expiry_date) }),
                    unit_price: unitPrice,
                    qty: allocated_qty,
                    itemLevel_sub_total: subTotal,
                    tax_rate: isExempt ? 0 : taxrate,
                    tax_type: isExempt ? "noTax" : (isIntra ? "intra" : "inter"),
                    tax_amount: isExempt ? 0 : taxAmount,
                    itemLevel_grand_total: grandTotal
                }, { transaction });
            }
        }

        // update invoice totals
        invoice.invoice_no = invNo;
        invoice.sub_total = header_sub_total;
        invoice.total_tax_amount = header_total_tax_amount;
        invoice.grand_total = header_grand_total;
        await invoice.save({ transaction });

        return invNo;

    } catch (error) {
        console.log(error);
        throw error;
    }
};

/** ------------------------Helper methods----------------------- */
async function getProduct(model, product_id) {
    const { Product, HSN } = model;
    try {
        const product = await Product.findByPk(
            Number(product_id), {
            attributes: ["id", "name", "hsn_code", "sku", "barcode"],
            include: [
                { model: HSN, as: "hsn" }
            ]
        });
        return product;
    } catch (error) {
        console.log("Error in getProduct:", error);
        throw error;
    }
}

async function isIntraState(buyerModel, vendorModel, indent) {
    try {
        const buyerLocation = await buyerModel.PurchasOrder.findByPk(
            Number(indent.buyer_po_id), {
            include: [
                {
                    model: buyerModel.BusinessNode,
                    as: "poFromBusinessNode",
                    include: [
                        {
                            model: buyerModel.NodeDetails,
                            as: 'nodeDetails'
                        }
                    ]
                }
            ]
        });


        const vendorLocation = await vendorModel.SalesOrder.findByPk(
            Number(indent.supplier_so_id), {
            include: [
                {
                    model: vendorModel.BusinessNode,
                    as: "soSellerBusinessNode",
                    include: [
                        {
                            model: vendorModel.NodeDetails,
                            as: 'nodeDetails'
                        }
                    ]
                }
            ]
        });

        const buyerState = buyerLocation?.poFromBusinessNode?.nodeDetails?.address?.state;
        const vendorState = vendorLocation?.soSellerBusinessNode?.nodeDetails?.address?.state;

        if (buyerState.id == vendorState.id) {
            return true;
        } else {
            return false;
        };

    } catch (error) {
        console.log("Error in isIntraOrInterState", error);
        throw error;
    }
}