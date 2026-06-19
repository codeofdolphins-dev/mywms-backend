import ExcelJS from "exceljs";

export const sampleProductUpload = async (req, res) => {
    try {
        const { type } = req.body;

        const workBook = new ExcelJS.Workbook();
        const sheet = workBook.addWorksheet("Product Details");

        // Build columns based on type — remove MRP for raw products
        const columns = [
            { header: "Product Name*", key: "name", width: 15 },
            { header: "Barcode*", key: "barcode", width: 15 },
            { header: "SKU*", key: "sku", width: 15 },
            { header: "Measure*", key: "measure", width: 15 },
            { header: "Unit Type*", key: "unit_type", width: 15 },
            { header: "Package Type*", key: "package_type", width: 15 },
            { header: "Brand Name", key: "brand_name", width: 15 },
            { header: "HSN Code*", key: "hsn", width: 15 },
            { header: "Tax Rate*", key: "rate", width: 15 },
            ...(type === "raw" ? [] : [{ header: "MRP*", key: "mrp", width: 15 }]),
            { header: "Expiry(Days)", key: "days", width: 15 },
            { header: "Minimum Stock", key: "min_stock", width: 15 },
        ];

        const totalCols = columns.length;

        // Set sheet columns (this creates the header row at row 1 automatically)
        sheet.columns = columns;

        // Insert a blank row at position 1 to push the header row down to row 2
        sheet.spliceRows(1, 0, []);
        const midCol = Math.floor(totalCols / 2);

        // Merge first half for label, and second half for warning note
        /**  sheet.mergeCells(startRow, startCol, endRow, endCol); */
        sheet.mergeCells(1, 1, 1, midCol);
        sheet.mergeCells(1, midCol + 1, 1, totalCols);

        // --- Row 1: Info / warning row ---
        const infoRow = sheet.getRow(1);

        // First merged cell (A1) — "Sample product upload: <type>"
        const labelCell = infoRow.getCell(1);
        labelCell.value = `Sample product upload: ${type.toUpperCase()}`;
        labelCell.font = { bold: true, size: 12, color: { argb: "FF1F4E78" } };
        labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD6E4F0" } };
        labelCell.alignment = { vertical: "middle", horizontal: "center" };

        // Second merged cell (starting at midCol + 1) — warning note
        const noteCell = infoRow.getCell(midCol + 1);
        noteCell.value = "⚠️ Do not change any headers ⚠️";
        noteCell.font = { italic: true, color: { argb: "FF9C0006" }, size: 11 };
        noteCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } };
        noteCell.alignment = { vertical: "middle", horizontal: "center" };

        infoRow.height = 24;
        infoRow.commit();

        // Style header row (now at row 2)
        const headerRow = sheet.getRow(2);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E75B6" } };
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });
        headerRow.height = 20;
        headerRow.commit();

        // Freeze pane below the header row (row 2)
        sheet.views = [
            { state: "frozen", ySplit: 2 }
        ];

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=sample_product_upload.xlsx");

        await workBook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message });
    };
};