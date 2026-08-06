import { asyncHandler } from "../../../utils/asyncHandler.js";
import { rootDB, getTenantConnection } from "../../../db/tenantMenager.service.js";
import { Op } from "sequelize";
import { updatePOStatus, updateSOStatus } from "../../../services/updateStatus.service.js";
import { generatePDF } from "../../../utils/pdf.service.js"


export const generateProformaInvoicePDF = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { BpoIndent, BpoIndentItem, BlanketOrder, BlanketOrderItem, ProductMapping, Connection, TenantsName, Tenant } = models;

    try {
        const { id = "", indent_no = "", po_id = "", so_id = "" } = req.body;

        if (!id && !indent_no && !po_id && !so_id) throw new Error("Either id or indent_no or po_id or so_id required!!!");

        const indent = await BpoIndent.findOne({
            where: {
                ...(id && { id: Number(id) }),
                ...(indent_no && { indent_no }),
                ...(po_id && { buyer_po_id: Number(po_id) }),
                ...(so_id && { supplier_so_id: Number(so_id) }),
            },
            include: [
                {
                    model: BlanketOrder,
                    as: "bpo",
                    attributes: ["id", "bpo_no", "pr_reference_code", "status", "valid_until"],
                },
                {
                    model: BpoIndentItem,
                    as: "bpoIndentItem",
                    include: [
                        {
                            model: BlanketOrderItem,
                            as: "parentBlanketOrderItem",
                            attributes: ["id", "product_mapping_id", "total_contracted_qty", "unit_price"],
                        }
                    ]
                },
                {
                    model: Connection,
                    as: "connection",
                    include: [
                        {
                            model: TenantsName,
                            as: "buyer",
                            include: [{ model: Tenant, as: "tenantDetails" }]
                        },
                        {
                            model: TenantsName,
                            as: "vendor",
                            include: [{ model: Tenant, as: "tenantDetails" }]
                        }
                    ]
                },
            ],
        });

        if (!indent) throw new Error("Indent record not found!!!");
        if (!indent.connection) throw new Error("Indent connection not found!!!");

        let templateData = indent.toJSON();

        /** Attached separately, NOT as a nested include: the generated column alias
         *  "bpoIndentItem.parentBlanketOrderItem.productMapping.buyer_product_id" is
         *  68 chars, past postgres' 63 byte identifier limit — postgres truncates it
         *  and the values silently come back undefined. */
        const mappingIds = [...new Set(
            (templateData.bpoIndentItem || []).map(i => i.parentBlanketOrderItem?.product_mapping_id).filter(Boolean)
        )];
        if (mappingIds.length > 0) {
            const mappings = await ProductMapping.findAll({
                where: { id: mappingIds },
                attributes: ["id", "buyer_product_id", "vendor_product_id"]
            });
            const mappingById = new Map(mappings.map(pm => [pm.id, pm.toJSON()]));
            for (const item of templateData.bpoIndentItem || []) {
                if (item.parentBlanketOrderItem) {
                    item.parentBlanketOrderItem.productMapping = mappingById.get(item.parentBlanketOrderItem.product_mapping_id) || null;
                }
            }
        }

        /** shape the template still expects */
        templateData.buyer_tenant = templateData.connection.buyer_tenant;
        templateData.vendor_tenant = templateData.connection.vendor_tenant;
        templateData.bpoIndentBuyerTenant = templateData.connection.buyer;
        templateData.bpoIndentVendorTenant = templateData.connection.vendor;

        if (templateData.buyer_tenant) {
            try {
                const { models: BuyerModels } = await getTenantConnection(templateData.buyer_tenant);
                const { Product, PurchasOrder } = BuyerModels;

                if (BuyerModels && Product) {
                    const productIds = templateData.bpoIndentItem
                        ?.map(item => item.parentBlanketOrderItem?.productMapping?.buyer_product_id)
                        .filter(id => id);

                    if (productIds && productIds.length > 0) {
                        const products = await BuyerModels.Product.findAll({
                            where: { id: { [Op.in]: [...new Set(productIds)] } },
                            attributes: ["id", "name", "sku", "barcode", "hsn_code", "measure", "unit_type", "package_type"]
                        });

                        const productMap = new Map(products.map(p => [p.id, p.toJSON()]));

                        templateData.bpoIndentItem = templateData.bpoIndentItem.map(item => ({
                            ...item,
                            product: productMap.get(item.parentBlanketOrderItem?.productMapping?.buyer_product_id) || null
                        }));
                    }
                }

                const purchasOrder = await PurchasOrder.findByPk(Number(templateData?.buyer_po_id))
                templateData.poNo = purchasOrder?.po_no;

            } catch (error) {
                console.error("Failed to fetch buyer products for proforma invoice:", error);
            }
        }

        // console.log(templateData)

        const pdf = await generatePDF("proforma-invoice", templateData);

        // prevent to update the status if the sales order is already closed
        let updateStatus = true;
        if (so_id && req.dbModels?.SalesOrder) {
            const salesOrder = await req.dbModels.SalesOrder.findByPk(Number(so_id));
            if (salesOrder && salesOrder.status === "assign_fg") {
                updateStatus = false;
            }
        }

        /** update PO & SO status */
        // const po = await updatePOStatus(indent, "poi_received", updateStatus);
        // await updateSOStatus(indent, "waiting_for_approval", updateStatus);
        const po = await updatePOStatus(indent, "approved", updateStatus);
        await updateSOStatus(indent, "approved", updateStatus);


        // generatePDF already returns a Buffer — do NOT re-wrap with Buffer.from()
        // as that reinterprets binary bytes as UTF-8 and corrupts the PDF.
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${po.po_no}.pdf"`
        );
        res.setHeader(
            "Access-Control-Expose-Headers",
            "Content-Disposition"
        );

        res.end(pdf);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, code: 500, message: err.message || "Failed to generate Proforma Invoice PDF" });
    }
});