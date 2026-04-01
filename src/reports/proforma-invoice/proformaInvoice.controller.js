import { asyncHandler } from "../../utils/asyncHandler.js";
import { generatePDF } from "../pdf.service.js";
import { rootDB, getTenantConnection } from "../../db/tenantMenager.service.js";
import { Op } from "sequelize";
import { updatePOStatus, updateSOStatus } from "../../services/updateStatus.service.js";

export const generateProformaInvoicePDF = asyncHandler(async (req, res) => {

    const { models } = await rootDB();
    const { BpoIndent, BpoIndentItem, BlanketOrder, BlanketOrderItem, TenantsName, Tenant } = models;

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
                            attributes: ["id", "buyer_product_id", "total_contracted_qty", "unit_price"],
                        }
                    ]
                },
                {
                    model: TenantsName,
                    as: "bpoIndentBuyerTenant",
                    include: [
                        {
                            model: Tenant,
                            as: "tenantDetails",
                        }
                    ]
                },
                {
                    model: TenantsName,
                    as: "bpoIndentVendorTenant",
                    include: [
                        {
                            model: Tenant,
                            as: "tenantDetails",
                        }
                    ]
                },
            ],
        });

        if (!indent) throw new Error("Indent record not found!!!");

        let templateData = indent.toJSON();

        if (templateData.buyer_tenant) {
            try {
                const { models: BuyerModels } = await getTenantConnection(templateData.buyer_tenant);
                if (BuyerModels && BuyerModels.Product) {
                    const productIds = templateData.bpoIndentItem
                        ?.map(item => item.parentBlanketOrderItem?.buyer_product_id)
                        .filter(id => id);

                    if (productIds && productIds.length > 0) {
                        const products = await BuyerModels.Product.findAll({
                            where: { id: { [Op.in]: [...new Set(productIds)] } },
                            attributes: ["id", "name", "sku"]
                        });

                        const productMap = new Map(products.map(p => [p.id, p.toJSON()]));

                        templateData.bpoIndentItem = templateData.bpoIndentItem.map(item => ({
                            ...item,
                            product: productMap.get(item.parentBlanketOrderItem?.buyer_product_id) || null
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch buyer products for proforma invoice:", error);
            }
        }

        const pdf = await generatePDF("proforma-invoice", templateData);


        /** update PO & SO status */
        await updatePOStatus(indent, "poi_received");
        await updateSOStatus(indent, "waiting_for_approval");

        const pdfBuffer = Buffer.from(pdf);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="PI-${indent.indent_no || id}.pdf"`
        );
        res.setHeader(
            "Access-Control-Expose-Headers",
            "Content-Disposition"
        );

        res.end(pdfBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, code: 500, message: err.message || "Failed to generate Proforma Invoice PDF" });
    }
});