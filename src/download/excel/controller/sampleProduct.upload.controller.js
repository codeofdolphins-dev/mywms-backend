import ExcelJS from "exceljs";

export const sampleProductUpload = async (req, res) => {

    try {
        const workBook = new ExcelJS.Workbook();
        const sheet = workBook.addWorksheet("Product Details");

        sheet.columns = [
            { header: "Product Name", key: "name", width: 20 },
            { header: "Barcode", key: "barcode", width: 20 },
            { header: "SKU", key: "sku", width: 20 },
            { header: "Measure", key: "measure", width: 20 },
            { header: "Unit Type", key: "unit_type", width: 20 },
            { header: "Package Type", key: "package_type", width: 20 },
            { header: "Brand Name", key: "brand_name", width: 20 },
            { header: "HSN Code", key: "hsn", width: 20 },
            { header: "Tax Rate", key: "rate", width: 20 },
            { header: 'MRP', key: 'mrp', width: 20 },
            { header: 'Expiry(Days)', key: 'days', width: 20 },
            { header: 'Minimum Stock', key: 'min_stock', width: 20 },
        ];

        sheet.views = [
            { state: "frozen", ySplit: 1 }
        ]

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        res.setHeader("Content-Disposition", "attachment; filename=sample product upload.xlsx");

        await workBook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message })
    };
};