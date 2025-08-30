import { Op } from "sequelize";
import Product from "../../models/product.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import renderPage from "../../utils/renderPage.js";
import fs from "fs";

// API
const productListAPI = asyncHandler(async (req, res) => {
    try {
        const { id = "", barcode = "", name = "" } = req.query;

        let whereClause = {};

        if (id) {
            whereClause.id = {
                [Op.eq]: id
            };
        }
        if (barcode) {
            whereClause.barcode = {
                [Op.like]: `%${barcode}%`
            };
        }
        if (name) {
            whereClause.name = {
                [Op.like]: `%${name}%`
            };
        }

        const productList = await Product.findAll({
            where: Object.keys(whereClause).length ? whereClause : undefined
        });

        if (!productList) return res.status(500).json({ success: false, code: 500, message: "Fatching errro!!!" });

        if(productList.length == 0){
            return res.status(200).json({ success: false, code: 200, message: "Not found!!!", data: [] });
        }
        
        return res.status(200).json({ success: true, code: 200, data: productList });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// GET request
const productListView = asyncHandler(async (req, res) => {
    try {

        const user = req.session.user;

        const productList = await Product.findAll({ where: { company_id: user.id } });

        const plainProductList = productList.map(product => product.get({ plain: true }));

        const data = await renderPage("./product/product", plainProductList);

        return res.render("../layout", {
            head: `
            <link rel="stylesheet" href="/assets/css/dataTables/jquery.dataTables.min.css">
            <link rel="stylesheet" href="/assets/css/dataTables/buttons.dataTables.min.css">
            `,
            customeScript: `
            <script src="/assets/js/dataTables/jquery.dataTables.min.js"></script>
            <script src="/assets/js/dataTables/dataTables.buttons.min.js"></script>
            <script src="/assets/js/dataTables/jszip.min.js"></script>
            <script src="/assets/js/dataTables/pdfmake.min.js"></script>
            <script src="/assets/js/dataTables/vfs_fonts.js"></script>
            <script src="/assets/js/dataTables/buttons.html5.min.js"></script>
            <script src="/assets/js/dataTables/buttons.print.min.js"></script>
            <script>
                $(document).ready(function () {

                    $('#example').DataTable({
                    dom: 'Bfrtip',
                    buttons: [
                        {
                        extend: 'copy',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] // include only these
                        }
                        },
                        {
                        extend: 'csv',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                        }
                        },
                        {
                        extend: 'excel',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                        }
                        },
                        {
                        extend: 'pdf',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                        }
                        },
                        {
                        extend: 'print',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                        }
                        }
                    ]
                    });
                });
            </script>
            <script src="/assets/js/sweetalert2@11.js"></script>
            <script type="module" src="/assets/js/customejs/product/product.js"></script>
        `,
            user,
            body: data,
            title: "Product List"
        });

    } catch (error) {
        console.log(error);
    }
});

const addProductView = asyncHandler(async (req, res) => {
    try {

        const user = req.session.user;

        const data = await renderPage("./product/addProduct");

        return res.render("../layout", {
            head: `
            <link rel="stylesheet" href="/assets/css/customeCss/product/addProduct.css">
            `,
            customeScript: `
            <script type="module" src="/assets/js/customejs/product/addProduct.js"></script>
            `,
            user,
            body: data,
            title: "Add Product"
        });

    } catch (error) {
        console.log(error);
    }
});

const editProductView = asyncHandler(async (req, res) => {
    try {

        const { user } = req.session;
        const { id } = req.query;

        const product = await Product.findByPk(id);

        // const plainProductList = productList.map(product => product.get({ plain: true }));

        const data = await renderPage("./product/addProduct", product);

        return res.render("../layout", {
            head: ``,
            customeScript: ``,
            user,
            body: data,
            title: "Edit Product Details"
        });

    } catch (error) {
        console.log(error);
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id required!!!" });

        const isDeleted = await Product.destroy({ where: { id: id } });

        console.log(isDeleted);


        if (!isDeleted) return res.status(500).json({ success: false, code: 500, message: "Product Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Product Deleted" });

    } catch (error) {
        console.log(error);
        return res.st(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST request
const addProduct = asyncHandler(async (req, res) => {
    try {
        const user = req.session.user;
        const { item_name = "", barcode = "", manufacture = "", mrp = "", aed = "", pack_size = "", liquor_kind = "", measure = "", hsn_code = "", description = "", landing_cost = "", status = "", brand_owner = "", distributor = "", sub_category = "", category = "", brand = "" } = req.body;
        const filename = req.file?.filename || "";

        if ([barcode, item_name, hsn_code].some(item => item === "")) return res.status(400).json({ succss: false, code: 400, message: `All fields are required!!!` });

        const isProductExists = await Product.findOne({ where: { barcode } });

        if (isProductExists) return res.status(409).json({ success: false, code: 409, message: `Product with barcode: ${barcode} already exists!!!` });

        const product = await Product.create({
            company_id: user.id,
            item_name,
            barcode,
            manufacture,
            item_mrp: mrp,
            aed,
            pack_size,
            liquor_kind,
            measure,
            hsn_code,
            description,
            landing_cost,
            status,
            brand_owner,
            distributor,
            sub_category,
            category,
            brand_owner: brand,
            photo: filename
        });

        if (!product) return res.status(200).json({ success: true, code: 200, message: "Product Addition failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Product Added." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editProduct = asyncHandler(async (req, res) => {
    try {
        const user = req.session.user;
        const { item_name = "", barcode = "", manufacture = "", mrp = "", aed = "", pack_size = "", liquor_kind = "", measure = "", hsn_code = "", description = "", landing_cost = "", status = "", brand_owner = "", distributor = "", sub_category = "", category = "", brand = "" } = req.body;
        const filename = req.file?.filename || "";

        // if (!barcode) return res.status(400).json({ succss: false, code: 400, message: `Barcode required!!!` });
        if (!barcode) return res.redirect(`/product?message="Not found!!!"`);

        const product = await Product.findAll({ where: { barcode } });

        let replace_object = {}
        if (item_name) replace_object.item_name = item_name.trim();
        if (barcode) replace_object.barcode = barcode.trim();
        if (manufacture) replace_object.manufacture = manufacture.trim();
        if (mrp) replace_object.item_mrp = mrp.trim();
        if (aed) replace_object.aed = aed.trim();
        if (pack_size) replace_object.pack_size = pack_size.trim();
        if (liquor_kind) replace_object.liquor_kind = liquor_kind.trim();
        if (measure) replace_object.measure = measure.trim();
        if (hsn_code) replace_object.hsn_code = hsn_code.trim();
        if (description) replace_object.description = description.trim();
        if (landing_cost) replace_object.landing_cost = landing_cost.trim();
        if (status) replace_object.status = status.trim();
        if (brand_owner) replace_object.brand_owner = brand_owner.trim();
        if (distributor) replace_object.distributor = distributor.trim();
        if (sub_category) replace_object.sub_category = sub_category.trim();
        if (category) replace_object.category = category.trim();
        if (brand) replace_object.brand = brand.trim();
        if (brand_owner) replace_object.brand_owner = brand_owner.trim();


        if (filename) {
            replace_object.filename = filename.trim();
            const oldImage = product.photo;
            fs.unlinkSync(`../../../public/assets/user/${oldImage}`);
        }

        await Product.update(
            replace_object,
            { where: { barcode } }
        );

        // return res.status(200).json({ success: true, code: 200, message: "Product details updated." });

        return res.redirect("/product");

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { productListView, addProductView, editProductView, addProduct, editProduct, deleteProduct, productListAPI };