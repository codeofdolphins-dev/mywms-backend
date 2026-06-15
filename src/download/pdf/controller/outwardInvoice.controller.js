import { asyncHandler } from "../../../utils/asyncHandler.js";
import { generatePDF } from "../../../utils/pdf.service.js"


export const generateOutwardInvoicePDF = asyncHandler(async (req, res) => {
    const { Outward, Invoice, Product } = req.models;

    try {
        const { outwardNo } = req.body;
        if (!outwardNo) throw new Error("Outward No is required!!!");

        const outward = await Outward.findOne({
            where: { outward_no: outwardNo }
        });
        if (!outward) throw new Error("Outward record not found!!!");

        const invoice = await Invoice.findOne({ where: { outward_id: outward.id } })
        if (!invoice) throw new Error("Invoice record not found!!!");

        return res.status(200).json({ success: true, code: 200, data: invoice });

        const formatData = invoice.toJSON();

        const pdf = await generatePDF("outward-invoice", formatData);

        // generatePDF already returns a Buffer — do NOT re-wrap with Buffer.from()
        // as that reinterprets binary bytes as UTF-8 and corrupts the PDF.
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${bpoNo}.pdf"`
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