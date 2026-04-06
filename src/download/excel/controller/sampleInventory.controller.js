import { asyncHandler } from "../../../utils/asyncHandler.js";
import ExcelJS from "exceljs";

export const sampleOpeningStock = asyncHandler(async (req, res) => {
    const { Product, BussinessNode, BusinessNodeType, ManufacturingUnit } = req.dbModels;
    try {
        const { locationId = "", storeId = "", type = "" } = req.body;

        if (!locationId) throw new Error("location id must required!!!");

        const location = await BussinessNode.findByPk(
            Number(locationId), {
            include: [
                {
                    model: BusinessNodeType,
                    as: "type",
                    attributes: ["category"]
                }
            ]
        });
        if (!location) throw new Error("Location not found!!!");

        let store = null;
        if (location.type.category == "manufacturing") {
            if (!storeId) throw new Error("store id must required!!!");

            store = await ManufacturingUnit.findByPk(Number(storeId));
            if (!store) throw new Error("Store not found!!!");
        }

        const products = await Product.findAll({
            where: {
                product_type: type.toLowerCase().trim()
            }
        });
        console.log(products);

        const productList = products.map(product => {
            return {
                location: location.name,
                store: store ? store.name : "",
                product_type: product.product_type,
                sku: product.sku,
            }
        });

        const workBook = new ExcelJS.Workbook();
        const sheet = workBook.addWorksheet("Opening Stock");

        sheet.columns = [
            { header: "Location", key: "location", width: 20 },
            { header: "Store", key: "store", width: 20 },
            { header: "Product Name", key: "name", width: 20 },
            { header: "SKU", key: "sku", width: 20 },
            { header: "Opening Qty", key: "qty", width: 20 },
            { header: "Batch Number", key: "batch", width: 20 },
            { header: "Manufacturing Date", key: "mfg_date", width: 20 },
            { header: "Expiry Date", key: "expiry_date", width: 20 },
            { header: 'Unit Cost', key: 'cost', width: 20 }
        ];

        productList.forEach(product => {
            sheet.addRow({
                location: product.location,
                store: product.store,
                name: product.name,
                sku: product.sku,
                // qty: "",
                // batch: "",
                // mfg_date: "",
                // expiry_date: "",
                // cost: ""
            });
        });

        sheet.views = [
            { state: "frozen", ySplit: 1 }
        ]

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        res.setHeader("Content-Disposition", "attachment; filename=sample_inventory.xlsx");

        await workBook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message })
    };
});