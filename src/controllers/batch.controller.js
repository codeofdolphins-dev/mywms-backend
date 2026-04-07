import { generateBatch, generateNo } from "../helper/generate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ExcelJS from "exceljs";


export const bulkOpeningStockInsertion = asyncHandler(async (req, res) => {
    const { Product, BusinessNode, ManufacturingUnit, NodeStockLedger, NodeStockLedgerItem, Batch } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    // console.log(req.body); return;
    try {
        const workBook = new ExcelJS.Workbook();
        await workBook.xlsx.load(req.file.buffer);

        const sheet = workBook.worksheets[0];
        const validateEntries = [];

        const firstRow = sheet.getRow(2);

        const locationId = firstRow.getCell(1).value;
        const StoreId = firstRow.getCell(2).value;

        sheet?.eachRow((row, rowNumber) => {
            // skip first line
            if (rowNumber === 1) return;

            const barcode = row.getCell(4).value
            const qty = row.getCell(6).value
            const batchNumber = row.getCell(7).value
            const mfgDate = row.getCell(8).value
            const expiryDate = row.getCell(9).value
            const unitPrice = row.getCell(10).value

            if (qty !== null && qty !== undefined && qty !== '' && unitPrice !== '') {
                validateEntries.push({
                    barcode,
                    qty: Number(qty),
                    batchNumber,
                    mfgDate: new Date(mfgDate),
                    expiryDate: new Date(expiryDate),
                    unitPrice: Number(unitPrice)
                });
            }
        });

        /** create ledger record */
        const ledger = await NodeStockLedger.create({
            transaction_type: "opening_stock",
            txn_date: new Date(),
            created_by: req.user.id
        }, { transaction });
        ledger.ledger_no = generateNo("LED", ledger.id);
        await ledger.save({ transaction });

        /** create batch and stock ledger item records */
        for (const item of validateEntries) {
            const product = await Product.findOne({
                where: { barcode: item.barcode }
            });
            if (!product) throw new Error(`Product with barcode ${item.barcode} not found!!!`);

            const batch = await Batch.create({
                product_id: product.id,
                location_id: locationId,
                store_id: StoreId,
                location_type: "mfg_unit",
                available_qty: item.qty,
                reference_id: ledger.id,
                reference_type: "opening_stock",
                unit_price: item.unitPrice,
                mfg_date: item.mfgDate,
                expiry_date: item.expiryDate,
                received_date: new Date(),
            }, { transaction });

            batch.batch_no = generateBatch("BAT", batch.id);
            await batch.save({ transaction });

            const ledgerItem = await NodeStockLedgerItem.create({
                ledger_id: ledger.id,
                product_id: product.id,
                batch_id: batch.id,
                qty: item.qty,
                unit_type: product.unit_type,
                unit_price: item.unitPrice,
                total_value: item.qty * item.unitPrice,
                balance_qty: item.qty,
            }, { transaction })
            ledgerItem.ledger_no = generateNo("LED", ledgerItem.id);
            await ledgerItem.save({ transaction });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Opening stock data inserted successfully" });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message })
    };
});