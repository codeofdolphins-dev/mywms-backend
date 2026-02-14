import { generateStockReportPDF } from "./report.service.js";

export const downloadRequisitionPDF = async (req, res) => {
    try {
        // fetch data from DB
        const data = [
            { sku: "SKU001", name: "Product A", qty: 100, location: "WH-1" },
            { sku: "SKU002", name: "Product B", qty: 50, location: "WH-2" }
        ];

        const pdf = await generateStockReportPDF(data);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=stock-report.pdf"
        );

        res.send(pdf);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate PDF" });
    }
};
