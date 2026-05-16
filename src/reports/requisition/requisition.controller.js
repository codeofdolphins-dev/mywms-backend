import { asyncHandler } from "../../utils/asyncHandler.js";
import { generatePDF } from "../pdf.service.js";


export const generateRequisitionPDF = asyncHandler(async (req, res) => {

    const { Requisition, RequisitionItem, User, Product, UnitType, PackageType, BusinessNode, NodeDetails } = req.dbModels;
    // const current_node = req.activeNode;

    try {
        const { id = "", requisition_no = "" } = req.body;

        if (!id && !requisition_no) throw new Error("Either id or requisition_no required!!!");

        const requisition = await Requisition.findOne({
            where: {
                ...(id && { id: Number(id) }),
                ...(requisition_no && { requisition_no }),
            },
            include: [
                {
                    model: User,
                    as: "createdBy",
                    attributes: ["name"]
                },
                {
                    model: BusinessNode,
                    as: "buyer",
                    attributes: ["name"],
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails"
                        }
                    ]
                },
                {
                    model: RequisitionItem,
                    as: "items",
                    attributes: {
                        exclude: ["requisition_id"],
                    },
                    required: false,
                    include: [
                        {
                            model: Product,
                            as: "product",
                            required: false,
                            include: [
                                {
                                    model: UnitType,
                                    as: "unitRef",
                                    required: false,
                                },
                                {
                                    model: PackageType,
                                    as: "packageType",
                                    required: false,
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        const pdf = await generatePDF("requisition", requisition);

        const pdfBuffer = Buffer.from(pdf);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${requisition_no}.pdf"`
        );
        res.setHeader(
            "Access-Control-Expose-Headers",
            "Content-Disposition"
        );

        res.end(pdfBuffer);

        // res.send(pdf);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, code: 500, message: "Failed to generate PDF" });
    }
});
