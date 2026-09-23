import { getTenantConnection, rootDB } from "../db/tenantMenager.service.js";

export async function createGrn_items_external(salesOrder, allocatedItems = [], outward_no = "") {
    const { models } = await rootDB();
    const { BpoIndent, ProductMapping, Connection } = models;

    let transaction = null;

    try {
        const indent = await BpoIndent.findOne({
            where: { id: salesOrder.central_indent_id },
            include: [{ model: Connection, as: "connection" }]
        });
        if (!indent) throw new Error("Indent not found!!!");
        if (!indent.connection) throw new Error("Indent connection not found!!!");


        const { models: tenantModels, sequelize } = await getTenantConnection(indent.connection.buyer_tenant);
        const { GRN, Vendor, PurchasOrder, GRNItem, GRNItemBatch, PurchaseOrderItem, ManufacturingUnit } = tenantModels;
        transaction = await sequelize.transaction();

        const po = await PurchasOrder.findOne({
            where: { po_no: salesOrder.source_po_no }
        });
        if (!po) throw new Error("PO not found!!!");

        const vendor = await Vendor.findOne({
            where: {
                tenant: indent.connection.vendor_tenant,
                linked_business_node_id: salesOrder.seller_business_node_id,
                type: "vendor"
            }
        });
        if (!vendor) throw new Error("Vendor not found!!!");

        let store = null;
        if (po?.target_store_id !== null) {
            store = await ManufacturingUnit.findByPk(Number(po?.target_store_id));
        }

        const grn = await GRN.create({
            grn_no: `GRN-${Date.now()}`,
            purchase_order: po.po_no,
            grn_type: "purchase",
            sender_id: vendor.id,
            status: "transit",
            reference: {
                buyer_tenant: indent.connection.buyer_tenant,
                vendor_tenant: indent.connection.vendor_tenant,
                outward_no: outward_no
            },
            ...(store ?
                {
                    receiver_id: store.business_node_id,
                    mfg_unit_id: store.id,
                } :
                {
                    receiver_id: po.from_business_node_id
                }),
        }, { transaction });

        if (allocatedItems && allocatedItems.length > 0) {
            // Attempt to iterate over the extracted allocated batches passed from outward allocation
            for (const item of allocatedItems) {

                // Fetch Product mapping to match vendor tenant product id with buyer tenant product id.
                // The indent carries its connection directly, so no tenant-pair lookup is needed —
                // that lookup could pick the wrong row when a pair has several connections.
                const productMap = await ProductMapping.findOne({
                    where: {
                        connection_id: indent.connection_id,
                        vendor_product_id: item.vendor_product_id
                    }
                });

                if (!productMap) {
                    throw new Error(`Product Mapping not found for vendor product ${item.vendor_product_id}`);
                }

                // Query the purchase order item with mapped buyer product id to fetch the ordered item reference
                const poItem = await PurchaseOrderItem.findOne({
                    where: {
                        purchase_order_id: po.id,
                        buyer_product_id: productMap.buyer_product_id
                    }
                });
                if (!poItem) throw new Error("poItem not found!!!");

                // console.log(productMap.toJSON());
                // console.log(poItem.toJSON());
                // throw new Error("test error");

                // Create the GRN item record connecting PO reference with received quantities
                const grnItem = await GRNItem.create({
                    grn_id: grn.id,
                    purchase_order_item_id: poItem.id,
                    product_id: productMap.buyer_product_id,
                    ordered_qty: poItem.qty,
                    received_qty: item.requested_qty
                }, { transaction });

                // Iterate over allocated batches associated with the current item to create GRN item batches
                for (const batch of item.allocated_batches) {
                    await GRNItemBatch.create({
                        grn_item_id: grnItem.id,
                        batch_no: batch.batch_no,
                        received_qty: batch.allocated_qty,
                        expiry_date: batch.expiry_date || null
                    }, { transaction });
                }
            }
        }

        await transaction.commit();
        return grn;

    } catch (error) {
        if (transaction) await transaction.rollback();
        throw error;
    }
}


export async function createGrn_items_trading(req, outward, allocatedItems = [], outward_no = "") {
    const { models } = await rootDB();
    const { ProductMapping, IntercompanyRequisition, IntercompanyRequisitionItems } = models;

    const vendorTenant = req.headers["x-tenant-id"];

    let transaction = null;

    try {
        const { buyer_tenant = "", connection_id = "", inter_comp_req_id = "" } = outward.meta || {};
        if (!buyer_tenant || !connection_id) throw new Error("Trading details not found on outward!!!");

        const requisition = await IntercompanyRequisition.findByPk(Number(inter_comp_req_id));
        if (!requisition) throw new Error("Trading requisition not found!!!");

        /** price fallback — outwards created by the vendor-assign flow carry no line prices,
         * but the central requisition items always do (keyed by product_mapping_id) */
        const requisitionItems = await IntercompanyRequisitionItems.findAll({
            where: { inter_comp_req_id: requisition.id }
        });
        const reqItemPriceByMapping = {};
        for (const reqItem of requisitionItems) {
            reqItemPriceByMapping[reqItem.product_mapping_id] = reqItem.line_total_price;
        }

        const { models: buyerModels, sequelize } = await getTenantConnection(buyer_tenant);
        const { GRN, GRNItem, GRNItemBatch, Vendor } = buyerModels;
        transaction = await sequelize.transaction();

        /** buyer side vendor record of the seller company — create from seller root node if missing */
        let vendor = await Vendor.findOne({
            where: {
                tenant: vendorTenant,
                type: "vendor",
                connection_id: Number(connection_id)
            }
        });
        if (!vendor) {
            const { BusinessNode, NodeDetails, User } = req.dbModels;

            const sellerDetails = await BusinessNode.findOne({
                where: {
                    node_type_code: null,
                    tenant_business_flow_id: null
                },
                include: [{ model: NodeDetails, as: "nodeDetails" }]
            });
            if (!sellerDetails?.nodeDetails) throw new Error("Seller company details not found!!!");

            const owner = await User.findOne({
                where: { is_owner: true },
                attributes: ["id", "phone_no", "email"]
            });

            vendor = await Vendor.create({
                name: sellerDetails.nodeDetails.name,
                tenant: vendorTenant,
                type: "vendor",
                connection_id: Number(connection_id),
                contact_email: owner?.email,
                contact_phone: owner?.phone_no,
                address: sellerDetails.nodeDetails.address,
                gst_no: sellerDetails.nodeDetails.gst_no,
                license_no: sellerDetails.nodeDetails.license_no,
            }, { transaction });
        }

        const grn = await GRN.create({
            grn_no: `GRN-${Date.now()}`,
            grn_type: "purchase",
            sender_id: vendor.id,
            receiver_id: requisition.buyer_node,
            status: "transit",
            total_price: Number(outward.total_price || requisition.total_price || 0),
            reference: {
                trading: true,
                buyer_tenant: buyer_tenant,
                requisition_no: requisition.requisition_no,
                vendor_tenant: vendorTenant,
                outward_no: outward_no,
            },
        }, { transaction });

        if (allocatedItems && allocatedItems.length > 0) {
            // Attempt to iterate over the extracted allocated batches passed from outward allocation
            for (const item of allocatedItems) {

                // Fetch Product mapping to match vendor tenant product id with buyer tenant product id
                const productMap = await ProductMapping.findOne({
                    where: {
                        connection_id: Number(connection_id),
                        vendor_product_id: item.vendor_product_id
                    }
                });

                if (!productMap) {
                    throw new Error(`Product Mapping not found for vendor product ${item.vendor_product_id}`);
                }

                // Create the GRN item record with received quantities
                const grnItem = await GRNItem.create({
                    grn_id: grn.id,
                    purchase_order_item_id: null,
                    product_id: productMap.buyer_product_id,
                    ordered_qty: item.requested_qty,
                    received_qty: item.requested_qty,
                    line_total_price: Number(item.line_total_price || reqItemPriceByMapping[productMap.id] || 0)
                }, { transaction });

                // Iterate over allocated batches associated with the current item to create GRN item batches
                for (const batch of item.allocated_batches) {
                    await GRNItemBatch.create({
                        grn_item_id: grnItem.id,
                        batch_no: batch.batch_no,
                        received_qty: batch.allocated_qty,
                        expiry_date: batch.expiry_date || null,
                        unit_price: Number(batch.unit_price || 0)
                    }, { transaction });
                }
            }
        }

        await transaction.commit();
        return grn;

    } catch (error) {
        if (transaction) await transaction.rollback();
        throw error;
    }
}


export async function createGrn_items_internal(req, transaction, outward, allocatedItems = [], transNo = "") {

    // for (const i of allocatedItems) {
    //     console.log("allocatedItems", i);
    // }

    // throw new Error("testing");

    try {
        const { GRN, GRNItem, GRNItemBatch, ManufacturingUnit } = req.dbModels;

        let store = null;
        if (outward?.store_id !== null) {
            store = await ManufacturingUnit.findByPk(Number(outward?.store_id));
        }

        const grn = await GRN.create({
            grn_no: `GRN-${Date.now()}`,
            grn_type: "transfer",
            sender_id: outward.seller_business_node_id,
            ...(store && { mfg_unit_id: outward?.store_id }),
            receiver_id: outward.buyer_business_node_id,
            status: "transit",
            ...(transNo && { reference: { directTransferNo: transNo } })
        }, { transaction });

        if (allocatedItems && allocatedItems.length > 0) {
            // Attempt to iterate over the extracted allocated batches passed from outward allocation
            for (const item of allocatedItems) {
                // For internal transfers, there is no vendor mapping or purchase order.
                // The vendor_product_id from outward maps directly to product_id.

                // Create the GRN item record connecting with received quantities
                const grnItem = await GRNItem.create({
                    grn_id: grn.id,
                    purchase_order_item_id: null,
                    product_id: item.vendor_product_id,
                    ordered_qty: item.requested_qty,
                    received_qty: item.requested_qty
                }, { transaction });

                // Iterate over allocated batches associated with the current item to create GRN item batches
                for (const batch of item.allocated_batches) {
                    await GRNItemBatch.create({
                        grn_item_id: grnItem.id,
                        batch_no: batch.batch_no,
                        received_qty: batch.allocated_qty,
                        expiry_date: batch.expiry_date || null
                    }, { transaction });
                }
            }
        }

        return grn;

    } catch (error) {
        throw error;
    }
}