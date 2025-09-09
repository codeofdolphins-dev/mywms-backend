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

        if(stockInward) return res.status(500).json({ success: false, code: 500, message: "Inward data fetched failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Inward Successfull.", data: stockInward });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST request
const createInward = asyncHandler(async (req, res) => {
    const { StockInward, StockInwardItem } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { items = [] } = req.body;
        const { order_no = "", invoice_no = "", t_pass_no = "", lr_no = "", vehicle = "", driver = "", status = "", indent_no = "" } = req.body;
        const { id } = req.user;

        if (items.length == 0) return res.status(400).json({ success: false, code: 300, message: "items should not empty!!!" });

        if ([order_no, invoice_no, t_pass_no, vehicle, driver].some(item => item === "")) return res.status(400).json({ success: false, code: 300, message: "Mandatory fields are required!!!" });

        const master = await StockInward.create({
            user_id: id,
            order_no,
            invoice_no,
            transport_pass_no: t_pass_no,
            lr_no,
            vehicle_id: vehicle,
            driver_id: driver,
            status_type: status,
            indent_no
        }, { transaction });

        for (const item of items) {
            await StockInwardItem.create({
                stock_inward_id: master.id,
                quantity: item.qty,
                damage_qty: item.d_qty,
                shortage_qty: item.s_qty,
                expiry_date: item.e_date,
                ...item
            }, { transaction });
        }

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