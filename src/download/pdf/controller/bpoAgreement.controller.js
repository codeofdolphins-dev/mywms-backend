import { asyncHandler } from "../../../utils/asyncHandler.js";
import { rootDB, getTenantConnection } from "../../../db/tenantMenager.service.js";
import { generatePDF } from "../../../utils/pdf.service.js";
import fs from "fs";
import path from "path";


export const generateBpoAgreementPDF = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { BlanketOrder, BlanketOrderItem, ProductMapping, Connection } = models;

    try {
        const { bpoNo = "" } = req.body;

        if (!bpoNo) throw new Error("BPO No is required!!!");

        const bpo = await BlanketOrder.findOne({
            where: { bpo_no: bpoNo },
            include: [
                { model: Connection, as: "connection" },
                {
                    model: BlanketOrderItem,
                    as: "blanketOrderItems",
                    include: [
                        {
                            model: ProductMapping,
                            as: "productMapping",
                            attributes: ["id", "buyer_product_id", "vendor_product_id"]
                        }
                    ]
                }
            ],
        });
        if (!bpo) throw new Error("BPO record not found!!!");
        if (!bpo.connection) throw new Error("BPO connection not found!!!");

        let formatData = bpo.toJSON();

        /** the template still renders these as a fallback label */
        formatData.buyer_tenant = formatData.connection.buyer_tenant;
        formatData.vendor_tenant = formatData.connection.vendor_tenant;

        const logoPath = path.join(process.cwd(), "public", "logo192.png");
        let watermarkLogo = "";
        if (fs.existsSync(logoPath)) {
            watermarkLogo = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
        }
        formatData.watermarkLogo = watermarkLogo;

        const { models: buyerModel } = await getTenantConnection(formatData.buyer_tenant);
        const { models: vendorModel } = await getTenantConnection(formatData.vendor_tenant);

        formatData.blanketOrderItems = await Promise.all(formatData.blanketOrderItems?.map(async item => {

            const buyerProduct = await buyerModel.Product.findByPk(Number(item.productMapping?.buyer_product_id))
            const vendorProduct = await vendorModel.Product.findByPk(Number(item.productMapping?.vendor_product_id))

            const buyerDetails = await buyerModel.User.findOne({
                where: { is_owner: true },
                attributes: ["id", "email", "company_name", "phone_no", 'profile_image'],
                include: [
                    {
                        model: buyerModel.BusinessNode,
                        as: "userBusinessNode",
                        through: { attributes: [] },
                        include: [
                            {
                                model: buyerModel.NodeDetails,
                                as: "nodeDetails"
                            }
                        ]
                    }
                ]
            });
            const vendorDetails = await vendorModel.User.findOne({
                where: { is_owner: true },
                attributes: ["id", "email", "company_name", "phone_no", 'profile_image'],
                include: [
                    {
                        model: vendorModel.BusinessNode,
                        as: "userBusinessNode",
                        through: { attributes: [] },
                        include: [
                            {
                                model: vendorModel.NodeDetails,
                                as: "nodeDetails"
                            }
                        ]
                    }
                ]
            });

            const buyerDetailsPlain = buyerDetails ? buyerDetails.toJSON() : null;
            if (buyerDetailsPlain) {
                buyerDetailsPlain.nodeDetails = buyerDetailsPlain.userBusinessNode?.[0]?.nodeDetails;
                delete buyerDetailsPlain.userBusinessNode;
            }

            const vendorDetailsPlain = vendorDetails ? vendorDetails.toJSON() : null;
            if (vendorDetailsPlain) {
                vendorDetailsPlain.nodeDetails = vendorDetailsPlain.userBusinessNode?.[0]?.nodeDetails;
                delete vendorDetailsPlain.userBusinessNode;
            }

            return {
                ...item,                          // raw DB fields first
                buyerProduct,                     // enriched — must come after ...item
                vendorProduct,
                buyerDetails: buyerDetailsPlain,
                vendorDetails: vendorDetailsPlain,
            }
        }));

        // return res.json({ formatData });

        const pdf = await generatePDF("bpo-agreement", formatData);

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
        res.status(500).json({ success: false, code: 500, message: err.message });
    }
});