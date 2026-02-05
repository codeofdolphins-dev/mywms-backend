import { dataSeederRoot } from "../helper/seeder.js";
import { getTenantConnection, rootDB } from "./tenantMenager.service.js";


const connectRootDB = async () => {
    const { rootSequelize, models } = await rootDB();
    // const { sequelize: tenant } = await getTenantConnection("tenant_tenant");
    // await tenant.sync({ alter: true });
    try {
        // await rootSequelize.sync({ force: true });

        const recordCount = await models.Role.count();
        if (recordCount === 0) {
            console.log("👑 💾 Start data seeding...");
            await dataSeederRoot(models);
            console.log("👑 ✅ Data seeded Successfully.");
        } else {
            console.log("👑 🛠️  Data already seeded. Skipping...");
        }
        console.log('Connection has been established successfully.');

    } catch (error) {
        if (error.original && error.original.code === '42P01') {
            console.warn("⚠️  Tables not found — creating them now...");
            await rootSequelize.sync({ alter: true });

            console.log("👑 💾 Start data seeding...");
            await dataSeederRoot(models);
            console.log("👑 ✅ Data seeded Successfully.");

        } else {
            console.error('Unable to connect to the database:', error);
            throw error;
        }
    }
}

export default connectRootDB;