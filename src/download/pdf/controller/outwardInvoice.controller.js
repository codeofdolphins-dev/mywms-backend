import { asyncHandler } from "../../../utils/asyncHandler.js";
import { generatePDF } from "../../../utils/pdf.service.js";
import { getTenantConnection } from "../../../db/tenantMenager.service.js"


export const generateOutwardInvoicePDF = asyncHandler(async (req, res) => {
    const { Outward, Invoice, InvoiceItem, BusinessNode, ManufacturingUnit } = req.dbModels;

    try {
        const { out_no } = req.body;
        if (!out_no) throw new Error("Outward No is required!!!");

        const outward = await Outward.findOne({
            where: { outward_no: out_no.trim() }
        });
        if (!outward) throw new Error("Outward record not found!!!");

        const invoice = await Invoice.findOne({
            where: {
                outward_id: outward.id
            },
            include: [
                {
                    model: InvoiceItem,
                    as: "invoiceItems"
                },
                // {
                //     model: BusinessNode,
                //     as: "seller"
                // },
                // {
                //     model: ManufacturingUnit,
                //     as: "dispatchStore"
                // },
            ]
        })
        if (!invoice) throw new Error("Invoice record not found!!!");
        const sellerDetails = await getCompanyDetails(req.dbModels);
        const customerDetails = await getCustomerDetails(invoice.buyer_tenant, invoice.buyer_businessNode_id);

        // return res.status(200).json({ success: true, code: 200, data: { invoice, sellerDetails, customerDetails } });

        const formatData = {
            invoice: invoice.toJSON(),
            sellerDetails: sellerDetails,
            customerDetails: customerDetails
        };

        const pdf = await generatePDF("outward-invoice", formatData);

        // generatePDF already returns a Buffer — do NOT re-wrap with Buffer.from()
        // as that reinterprets binary bytes as UTF-8 and corrupts the PDF.
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${invoice.invoice_no}.pdf"`
        );
        res.setHeader(
            "Access-Control-Expose-Headers",
            "Content-Disposition"
        );

        res.end(pdf);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, code: 500, message: err.message });
    }
});


/** -----------------helper-------------------- */
async function getCompanyDetails(models) {
    try {
        const { BusinessNode, NodeDetails } = models;

        const companyDeails = await BusinessNode.findOne({
            where: {
                node_type_code: null,
                tenant_business_flow_id: null
            },
            include: [
                {
                    model: NodeDetails,
                    as: "nodeDetails",
                }
            ]
        });

        return companyDeails.nodeDetails.toJSON();

    } catch (error) {
        console.log(error)
        throw error;
    }

}

async function getCustomerDetails(buyerTenant, buyerNodeId) {

    const { models } = await getTenantConnection(buyerTenant);
    const { BusinessNode, NodeDetails } = models;
    try {
        const businessNode = await BusinessNode.findByPk(
            Number(buyerNodeId), {
            include: [
                {
                    model: NodeDetails,
                    as: "nodeDetails"
                }
            ]
        });

        return businessNode.nodeDetails.toJSON();

    } catch (error) {
        console.log(error)
        throw error;
    };
}