import { asyncHandler } from "../utils/asyncHandler.js";
import { Op, Sequelize } from "sequelize";
import bcrypt from "bcrypt";

// GET
export const allVendorList = asyncHandler(async (req, res) => {
    const { Vendor, VendorCategory } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", text = "", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const vendor = await Vendor.findAndCountAll({
            where: {
                ...(id && { id }),
                ...(text ? {
                    [Op.or]: [
                        { email: { [Op.iLike]: `${text}%` } },
                        Sequelize.where(
                            Sequelize.json("name.full_name"),
                            { [Op.iLike]: `${text}%` }
                        ),
                        { phone: { [Op.iLike]: `${text}%` } },
                    ]
                } : {}),
            },
            attributes: {
                exclude: ["password", "access_token"]
            },
            include: [
                {
                    model: VendorCategory,
                    as: "vendorCategory",
                },
            ],
            ...(noLimit && { limit, offset }),
            order: [["createdAt", "ASC"]],
        });
        if (!vendor) return res.status(404).json({ success: false, code: 404, message: "Vendor not found!!!" });

        const totalItems = vendor.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: id ? vendor.rows[0] : vendor.rows,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// PUT
const updateVendorDetails = asyncHandler(async (req, res) => {
    const { IndividualDetails } = req.dbModels;
    try {
        const { individualDetails } = req.user || null;
        const { full_name = "", phone = "", address = "", state_id = "", district_id = "", pincode = "" } = req.body;
        const profile_image = req?.file?.filename || null;

        let updateDetails = {};
        if (full_name) updateDetails.full_name = full_name;
        if (phone) updateDetails.phone = phone;
        if (address) updateDetails.address = address;
        if (state_id) updateDetails.state_id = state_id;
        if (district_id) updateDetails.district_id = district_id;
        if (pincode) updateDetails.pincode = pincode;

        if (profile_image) {
            const oldImagePath = path.join(
                process.cwd(),
                "public",
                "user",
                updateDetails.profile_image
            );

            // Safely unlink if file exists
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            individualDetails.profile_image = profile_image;
        }

        const isUpdated = await IndividualDetails.update({
            updateDetails,
            where: { id: individualDetails.id },
        });

        if (!isUpdated) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Employee details updated successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteVendor = asyncHandler(async (req, res) => {
    const { User, IndividualDetails } = req.dbModels;
    try {
        const { targetEmail, adminPassword } = req.body;
        if (!targetEmail || !adminPassword) return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        const userDetails = req.user;

        const user = await User.findOne({
            where: { email: targetEmail },
            include: [
                {
                    model: IndividualDetails,
                    as: "individualDetails"
                }
            ]
        });
        if (!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });

        const admin = await User.findByPk(userDetails.id);

        const is_password_matched = await bcrypt.compare(adminPassword, admin.password);

        if (!is_password_matched) return res.status(401).json({ success: false, code: 401, message: "Wrong password!!!" });

        if (user.individualDetails.profile_image !== null) {
            const oldImagePath = path.join(
                process.cwd(),
                "public",
                "user",
                user.individualDetails.profile_image
            );
            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }

        const isDeleted = await user.destroy({ where: { email: targetEmail } });

        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion filled!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Employee successfully deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});
