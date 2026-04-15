import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImage } from "../utils/handelImage.js";


// Upsert (update or create) NodeDetails for a user's BusinessNode
export const upsertCompanyDetails = asyncHandler(async (req, res) => {
    const { User, BusinessNode, NodeDetails, NodeUser } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const dbName = req.headers["x-tenant-id"];
    const profile_image = req?.file?.filename || null;

    try {
        const { user_id = "", name = "", location = "", address = "", gst_no = "", license_no = "", desc = "", state = "", district = "", lat = "", long = "", businessNode_id = "" } = req.body;

        if ([user_id, name, location, address, state, district, gst_no, businessNode_id].some(i => i === "")) return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });

        // Verify user exists
        const user = await User.findByPk(user_id, {
            attributes: ["id", "email", "name"],
        });
        if (!user) return res.status(404).json({ success: false, code: 404, message: "User not found!!!" });


        /** Update company name */
        if (name) await User.update({ company_name: name }, { where: {}, transaction });


        /** Find business node */
        const businessNode = await BusinessNode.findByPk(Number(businessNode_id));
        if (!businessNode) return res.status(404).json({ success: false, code: 404, message: "Business node record not found!!!" });

        businessNode.name = name;
        await businessNode.save({ transaction });

        /** Check if NodeDetails already exists for this BusinessNode */
        const nodeDetails = await NodeDetails.findOne({ where: { business_node_id: businessNode.id } });

        let isNewlyCreated = false;

        if (nodeDetails) {
            // Update the existing record with provided fields
            if (name) nodeDetails.name = name;
            if (location) nodeDetails.location = location;
            if (gst_no) nodeDetails.gst_no = gst_no;
            if (license_no) nodeDetails.license_no = license_no;
            if (desc) nodeDetails.desc = desc;
            if (profile_image) {
                if (nodeDetails.image) {
                    await deleteImage(nodeDetails.image);
                }
                nodeDetails.image = `${dbName}/${profile_image}`;
            }

            if (address) nodeDetails.address.address = address;
            if (state) nodeDetails.address.state = state;
            if (district) nodeDetails.address.district = district;
            if (lat) nodeDetails.address.lat = lat;
            if (long) nodeDetails.address.long = long;

            await nodeDetails.save({ transaction });

        } else {
            // Create a new NodeDetails record
            await NodeDetails.create({
                business_node_id: businessNode.id,
                name: name,
                location: location,
                address: {
                    address: address,
                    state: state,
                    district: district,
                    lat: lat,
                    long: long,
                },
                ...(profile_image && { image: `${dbName}/${profile_image}` }),
                gst_no: gst_no,
                license_no: license_no,
                desc: desc,
            }, { transaction });

            isNewlyCreated = true;
        }

        await transaction.commit();

        return res.status(isNewlyCreated ? 201 : 200).json({
            success: true,
            code: isNewlyCreated ? 201 : 200,
            message: isNewlyCreated ? "Node details created successfully." : "Node details updated successfully.",
        });

    } catch (error) {
        console.log(error);
        if (transaction) await transaction.rollback();
        if (profile_image) {
            await deleteImage(profile_image, dbName);
        }
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export const registerBusinessNode = asyncHandler(async (req, res) => {
    const { BusinessNode, NodeDetails, TenantBusinessFlow } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const dbName = req.headers["x-tenant-id"];
    const profile_image = req?.file?.filename || null;
    try {
        let { full_name = "", location = "", address = "", state = "", district = "", pincode = "", node = "", gst_no = "", license_no = "", lat = "", long = "", desc = "" } = req.body;

        if ([full_name, location, address, state, district, pincode, node].some(item => item === "")) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields missing!!!" });
        }
        node = JSON.parse(node);
        state = JSON.parse(state);
        district = JSON.parse(district);

        const tenantBusinessFlow = await TenantBusinessFlow.findOne({ where: { node_type_code: node.code }, transaction });
        if (!tenantBusinessFlow) {
            throw new Error("Invalid business node type code!!!");
        };

        /** create business node */
        const businessNode = await BusinessNode.create({
            name: `${node.name} - ${location}`,
            node_type_code: node.code,
            tenant_business_flow_id: tenantBusinessFlow.id,
        }, { transaction });

        /**create node details */
        const nodeDetails = await NodeDetails.create({
            name: full_name,
            business_node_id: businessNode.id,
            location,
            address: {
                address,
                state: state,
                district: district,
                pincode,
                ...((lat && long) ? { lat, long } : {})
            },
            gst_no,
            license_no,
            ...(profile_image && { image: `${dbName}/${profile_image}` }),
            desc
        }, { transaction });
        if (!nodeDetails) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export const deleteNode = asyncHandler(async (req, res) => {
    const { BusinessNode } = req.dbModels;
    try {
        const { id } = req.params;
        const node = await BusinessNode.destroy({ where: { id } });
        if (!node) return res.status(500).json({ success: false, code: 500, message: "Deleted failed!!!" });
        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});