import { asyncHandler } from "../utils/asyncHandler.js";


// GET request

const getInward = asyncHandler(async (req, res) => {
    const { StockInward, StockInwardItem } = req.dbModels;

    try {
        const { id } = req.query;

        const stockInward = await StockInward.findAll({
            where: id !== "" ? { id } : undefined,
            include: [
                {
                    model: StockInwardItem,
                    as: "items"
                }
            ]
        });

        if (stockInward) return res.status(500).json({ success: false, code: 500, message: "Inward data fetched failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Inward Successfull.", data: stockInward });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST request
const createInward = asyncHandler(async (req, res) => {
    const { StockInward, StockInwardItem, Product, Batch } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { po_id = "", vendor_id = "", challan_no = "", invoice_id = "", t_pass_no = "", vehicle_id = "", driver_id = "", status = "", note = "", items = [] } = req.body;
        if ([po_id, vendor_id, vehicle_id, driver_id].some(item => item === "")) return res.status(400).json({ success: false, code: 300, message: "Required field missing!!!" });

        if (items.length == 0) return res.status(400).json({ success: false, code: 300, message: "items should not empty!!!" });

        const userDetails = req.user;

        const stockInward = await StockInward.create({
            po_id: parseInt(po_id, 10),
            vendor_id: parseInt(vendor_id, 10),
            inward_by: userDetails.id,
            challan_no,
            invoice_id: parseInt(invoice_id, 10),
            transport_pass_no: t_pass_no,
            lr_no,
            vehicle_id: parseInt(vehicle_id, 10),
            driver_id: parseInt(driver_id, 10),
            status: status.toLocalString(),
            note
        }, { transaction });

        for (const item of items) {
            const product = await Product.findOne({
                where: {
                    barcode: parseInt(item.barcode)
                },
                transaction
            });
            if (!product) {
                if (transaction) await transaction.rollback();
                return res.status(200).json({ success: true, code: 200, message: `Product with barcode: ${item.barcode} not found` });
            };

            const totalQty = parseInt(item.qty, 10) - (parseInt(item.d_qty, 10) + parseInt(item.s_qty, 10));
            if (totalQty <= 0) {
                await transaction.rollback();
                return res.status(200).json({ success: true, code: 200, message: 'Invalide quentity entered!!!' });
            };
            const totalCost = totalQty * parseInt(item.unit_cost, 10);

            await StockInwardItem.create({
                stock_inward_id: stockInward.id,
                product_id: product.id,
                damage_qty: item.d_qty,
                shortage_qty: item.s_qty,
                total_cost: totalCost,
                ...item
            }, { transaction });

            const batch = await Batch.findOne({ where: { batch_number: item.batch_no, product_id: product.id } });
            if (batch) {
                const extendQty = batch.qty + totalQty;
                await Batch.update(
                    { qty: extendQty },
                    { where: { id: batch.id } }
                );
            }else{
                await batch.create({
                    product_id: product.id,
                    batch_number: batch_no,
                    expiry_date: item.e_date,
                    qty: totalQty
                })
            }
        };

        await transaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Inward Successfull." });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteInward = asyncHandler(async (req, res) => {
    const { StockInward, StockInwardItem } = req.dbModels;

    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, code: 400, message: "id required!!!" });

        await StockInward.destory({ where: { id } });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfull." });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { getInward, createInward, deleteInward };