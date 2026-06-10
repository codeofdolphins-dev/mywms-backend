import { asyncHandler } from "../../../utils/asyncHandler.js";
import { rootDB, getTenantConnection } from "../../../db/tenantMenager.service.js";
import { generatePDF } from "../../../utils/pdf.service.js"


export const generateBpoAgreementPDF = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { BlanketOrder, BlanketOrderItem } = models;

    try {
        const { bpoNo = "" } = req.body;

        if (!bpoNo) throw new Error("BPO No is required!!!");

        const bpo = await BlanketOrder.findOne({
            where: { bpo_no: bpoNo },
            include: [
                {
                    model: BlanketOrderItem,
                    as: "blanketOrderItems"
                }
            ],
        });
        if (!bpo) throw new Error("BPO record not found!!!");

        let formatData = bpo.toJSON();

        const { models: buyerModel } = await getTenantConnection(formatData.buyer_tenant);
        const { models: vendorModel } = await getTenantConnection(formatData.vendor_tenant);

        formatData.blanketOrderItems = await Promise.all(formatData.blanketOrderItems?.map(async item => {

            const buyerProduct = await buyerModel.Product.findByPk(Number(item.buyer_product_id))
            const vendorProduct = await vendorModel.Product.findByPk(Number(item.vendor_product_id))

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


        // return res.json({ data: formatData });




        // console.log(templateData)

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