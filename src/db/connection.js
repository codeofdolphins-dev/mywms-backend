// import { db_obj } from "./config.js";
import dataSeeder from "../helper/seeder.js";
import { rootDB } from "./tenantMenager.service.js";


const connectRootDB = async () => {
    try {
        const { rootSequelize, models } = await rootDB();

        // await rootSequelize.sync({ force: true });

        const recordCount = await models.Role.count();
        if (recordCount === 0) {
            console.log("👑 💾 Start data seeding...");
            await dataSeeder(models);
            console.log("👑 ✅ Data seeded Successfully.");
        } else {
            console.log("👑 🛠️  Data already seeded. Skipping...");
        }
        console.log('Connection has been established successfully.');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;

    }
}

export default connectRootDB;