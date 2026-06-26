import { asyncHandler } from "../../../utils/asyncHandler.js";
import { getTenantConnection, rootDB } from "../../../db/tenantMenager.service.js";
import { generatePDF } from "../../../utils/pdf.service.js";

export const getQuotation = asyncHandler(async (req, res) => {
    try {
        const { reqNo } = req.params;
        if (!reqNo) return res.status(400).json({ success: false, code: 400, message: "Requisition no is required!!!" });

        const isExternal = reqNo.startsWith("EX");
        if (isExternal) {
            const quotation = await getExternalQuotationDetails(reqNo);

            // return res.json({ data: { ...quotation, reqNo } });

            const pdf = await generatePDF("quotation", { ...quotation, reqNo });

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="Quotation-${reqNo}.pdf"`
            );
            res.setHeader(
                "Access-Control-Expose-Headers",
                "Content-Disposition"
            );

            return res.status(200).end(pdf);
        } else {
            return res.status(400).json({ success: false, code: 400, message: "Internal quotation not supported yet!!!" });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const getExternalQuotationDetails = async (reqNo) => {
    const { rootSequelize, models } = await rootDB()
    const { RFQ, RfqQuotation, RfqQuotationRevision, RfqQuotationItem, ProductMapping, Connection } = models;

    try {
        const rfq = await RFQ.findOne({ where: { pr_reference_code: reqNo } });
        if (!rfq) throw new Error("RFQ not found!!!");

        // console.log(rfq.toJSON());

        const quotation = await RfqQuotation.findOne({
            where: { rfq_id: rfq.id },
            include: [
                {
                    model: RfqQuotationRevision,
                    as: "quotationRevision",
                    include: [
                        {
                            model: RfqQuotationItem,
                            as: "revisionItems",
                            // include: [
                            //     {
                            //         model: ProductMapping,
                            //         as: "productMapping",
                            //         include: [
                            //             {
                            //                 model: Connection,
                            //                 as: "conn"
                            //             }
                            //         ]
                            //     }
                            // ]
                        }
                    ]
                }
            ]
        });

        // Convert to plain JS object FIRST so all mutations persist
        const quotationData = quotation.toJSON();
        quotationData.buyerDetails = rfq.meta;

        await Promise.all(
            quotationData.quotationRevision.map(async (revision) => {
                await Promise.all(
                    revision.revisionItems.map(async (item) => {

                        const productMap = await ProductMapping.findByPk(item.product_map_id, {
                            include: [
                                {
                                    model: Connection,
                                    as: "conn"
                                }
                            ]
                        });
                        if (!productMap) throw new Error("Product map not found!!!");

                        const buyerProduct = await getProductDetails(productMap.conn.buyer_tenant, productMap.buyer_product_id);
                        const vendorProduct = await getProductDetails(productMap.conn.vendor_tenant, productMap.vendor_product_id);

                        item.buyerProduct = buyerProduct.toJSON();
                        item.vendorProduct = vendorProduct.toJSON();
                    })
                );
            })
        );

        return quotationData;

    } catch (error) {
        console.log(error);
        throw error;
    }
}

const getProductDetails = async (tenant, id) => {
    try {
        const { models } = await getTenantConnection(tenant);
        const { Product } = models;

        const product = await Product.findByPk(
            id, { attributes: ["id", "name", "hsn_code", "sku", "barcode", "measure", "unit_type"] }
        );
        if (!product) throw new Error("Product not found!!!");

        return product;

    } catch (error) {
        console.log(error);
        throw error;
    }
};