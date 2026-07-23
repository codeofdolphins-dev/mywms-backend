import { asyncHandler } from "../../../utils/asyncHandler.js";
import { generatePDF } from "../../../utils/pdf.service.js";
import { getTenantConnection, rootDB } from "../../../db/tenantMenager.service.js"


export const generateTradingInvoicePDF = asyncHandler(async (req, res) => {
    const tenant = req.headers["x-tenant-id"];

    try {
        const { requisition_no } = req.body;
        if (!requisition_no) throw new Error("Requisition No is required!!!");

        /** central trading requisition + connection */
        const { models } = await rootDB();
        const { IntercompanyRequisition, Connection } = models;

        const requisition = await IntercompanyRequisition.findOne({
            where: { requisition_no: requisition_no.trim() },
            include: [{ model: Connection, as: "icReqConnection" }],
        });
        if (!requisition) throw new Error("Trading requisition not found!!!");

        const connection = requisition.icReqConnection;
        if (![connection?.buyer_tenant, connection?.vendor_tenant].includes(tenant)) {
            return res.status(403).json({ success: false, code: 403, message: "You are not a party of this requisition!!!" });
        }

        /** outward lives on the vendor tenant — resolve it there so both sides can download */
        const { models: vendorModels } = await getTenantConnection(connection.vendor_tenant);
        const { Outward, OutwardItem, Product, OutwardAllocation, Batch } = vendorModels;

        const outward = await Outward.findOne({
            where: { pr_no: requisition.requisition_no },
            include: [
                {
                    model: OutwardItem,
                    as: "outwardItemList",
                    include: [
                        {
                            model: Product,
                            as: "outwardProduct"
                        }
                    ]
                }
            ]
        });
        if (!outward) throw new Error("Outward record not found!!!");
        if (outward.status !== "dispatched") throw new Error("Outward is not dispatched yet!!!");

        /** flatten items — one row per allocated batch */
        const items = [];
        for (const item of outward.outwardItemList) {
            const allocations = await OutwardAllocation.findAll({
                where: { outward_item_id: item.id },
                include: [
                    {
                        model: Batch,
                        as: "batch"
                    }
                ]
            });

            const product = item.outwardProduct;
            if (allocations.length > 0) {
                for (const alloc of allocations) {
                    items.push({
                        product_name: product?.name,
                        sku: product?.sku,
                        hsn_code: product?.hsn_code,
                        batch_no: alloc.batch?.batch_no,
                        mfg_date: alloc.batch?.mfg_date,
                        expiry_date: alloc.batch?.expiry_date,
                        qty: alloc.allocated_qty
                    });
                }
            } else {
                items.push({
                    product_name: product?.name,
                    sku: product?.sku,
                    hsn_code: product?.hsn_code,
                    batch_no: null,
                    mfg_date: null,
                    expiry_date: null,
                    qty: item.requested_qty
                });
            }
        }

        const sellerDetails = await getRootNodeDetails(connection.vendor_tenant);
        const customerDetails = await getBuyerDetails(connection.buyer_tenant, requisition.buyer_node);

        const formatData = {
            requisition: requisition.toJSON(),
            outward: outward.toJSON(),
            items,
            sellerDetails,
            customerDetails
        };

        const pdf = await generatePDF("trading-invoice", formatData);

        // generatePDF already returns a Buffer — do NOT re-wrap with Buffer.from()
        // as that reinterprets binary bytes as UTF-8 and corrupts the PDF.
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${requisition.requisition_no}.pdf"`
        );
        res.setHeader(
            "Access-Control-Expose-Headers",
            "Content-Disposition"
        );

        res.end(pdf);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, code: 500, message: err.message });
    }
});


/** -----------------helper-------------------- */
async function getRootNodeDetails(tenant) {
    const { models } = await getTenantConnection(tenant);
    const { BusinessNode, NodeDetails } = models;
    try {
        const companyDeails = await BusinessNode.findOne({
            where: {
                node_type_code: null,
                tenant_business_flow_id: null
            },
            include: [
                {
                    model: NodeDetails,
                    as: "nodeDetails",
                }
            ]
        });

        return companyDeails.nodeDetails.toJSON();

    } catch (error) {
        console.log(error)
        throw error;
    }
}

async function getBuyerDetails(buyerTenant, buyerNodeId) {
    const { models } = await getTenantConnection(buyerTenant);
    const { BusinessNode, NodeDetails } = models;
    try {
        const businessNode = await BusinessNode.findByPk(
            Number(buyerNodeId), {
            include: [
                {
                    model: NodeDetails,
                    as: "nodeDetails"
                }
            ]
        });

        /** fallback to buyer root company when the node has no details of its own */
        if (businessNode?.nodeDetails) return businessNode.nodeDetails.toJSON();
        return await getRootNodeDetails(buyerTenant);

    } catch (error) {
        console.log(error)
        throw error;
    };
}
