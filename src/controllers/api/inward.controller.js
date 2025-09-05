import { asyncHandler } from "../../utils/asyncHandler.js";


// GET request

// POST request
const addItem = asyncHandler(async (req, res) => {
    try {
        const { barcode = "", brand = "", brandName = "", batch_no = "", qty = "", d_qty = "", s_qty = "", e_date = "" } = req.body;

        if ([barcode, brand, batch_no, qty].some(item => item === "")) return res.status(400).json({ status: false, code: 400, message: "all fields are required!!!" });

        if (!req.session.inwardItems) req.session.inwardItems = [];
        req.session.inwardItems.push({
            barcode,
            brand,
            brandName,
            batch_no,
            qty,
            d_qty: d_qty === "" ? 0 : d_qty,
            s_qty: s_qty === "" ? 0 : s_qty,
            e_date
        })

        return res.status(200).json({ success: true, code: 200, message: "", data: req.session.inwardItems });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const removeItem = asyncHandler(async (req, res) => {
    try {
        req.session.inwardItems.splice(req.body.index, 1);
        res.json({ items: req.session.inwardItems });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const inwardSubmit = asyncHandler(async (req, res) => {
    const { StockInward, StockInwardItem } = req.dbModels;
    try {
        const { order_no = "", invoice_no = "", t_pass_no = "", lr_no = "", vehicle = "", driver = "", status = "", indent_no = "" } = req.body;

        if ([order_no, invoice_no, lr_no, vehicle, driver, indent_no].some(item => item === "")) return res.status(500).json({ success: false, code: 500, message: "All fields are required" });

        const role = req.session.user.role.role;

        let company_id = "";
        let user_id = "";

        if (role === "super-admin" || role === "company-admin") {
            company_id = req.session.user.id;
            user_id = req.session.user.id;
        } else {
            company_id = req.session.user.company_id;
            user_id = req.session.user.id;
        }

        const master = await StockInward.create({
            company_id,
            user_id,
            order_no,
            invoice_no,
            t_pass_no,
            lr_no,
            vehicle_id: vehicle,
            driver_id: driver,
            status,
            indent_no
        });

        for (const item of req.session.inwardItems) {
            delete item.brandName
            await StockInwardItem.create({
                stock_inward_id: master.id,
                quantity: item.qty,
                damage_qty: item.d_qty,
                shortage_qty: item.s_qty,
                expiry_date: item.e_date,
                ...item
            });
        }

        delete req.session.inwardItems;

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const createInward = asyncHandler(async (req, res) => {
    const { StockInward, StockInwardItem } = req.dbModels;
    try {
        const { items = [] } = req.body;
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { addItem, removeItem, inwardSubmit, createInward };