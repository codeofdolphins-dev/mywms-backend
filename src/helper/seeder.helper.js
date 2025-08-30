import { db_obj } from "../db/config.js";
import Role from "../models/role.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const defaultRoles = [
    { role: "Admin" },
    { role: "company" },
    { role: "User" }
];

const seeder = asyncHandler(async (schemaName, transaction) => {
    try {
        // 1. Create schema
        await db_obj.createSchema(schemaName, { ifNotExists: true }, { transaction });

        const roleModel = Role.schema(schemaName);

        // 2. Sync models for this schema
        await Role.schema(schemaName).sync({ transaction });

        // 3. Seed default roles
        await Role.schema(schemaName).bulkCreate(defaultRoles, { transaction });

        console.log(`✅ Tenant ${schemaName} initialized with roles`);
    } catch (err) {
        console.error("❌ Error provisioning tenant:", err);
        throw err;
    }
})

export { seeder };