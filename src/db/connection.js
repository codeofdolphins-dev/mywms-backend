import { dataSeederRoot } from "../helper/seeder.js";
import { getRootMigrator } from "./migrator.js";
import { rootDB } from "./tenantMenager.service.js";

/** ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ Without migration setup ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ */
// const connectRootDB = async () => {
//     const { rootSequelize, models } = await rootDB();
//     try {
//         // await rootSequelize.sync({ force: true });

//         const recordCount = await models.Role.count();
//         if (recordCount === 0) {
//             console.log("👑 💾 Start data seeding...");
//             await dataSeederRoot(models);
//             console.log("👑 ✅ Data seeded Successfully.");
//         } else {
//             console.log("👑 🛠️  Data already seeded. Skipping...");
//         }
//         console.log('Connection has been established successfully.');

//     } catch (error) {
//         if (error.original && error.original.code === '42P01') {
//             console.warn("⚠️  Tables not found — creating them now...");
//             await rootSequelize.sync({ alter: true });

//             console.log("👑 💾 Start data seeding...");
//             await dataSeederRoot(models);
//             console.log("👑 ✅ Data seeded Successfully.");

//         } else {
//             console.error('Unable to connect to the database:', error);
//             throw error;
//         }
//     }
// }


/** ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ WITH migration setup ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ */
const connectRootDB = async () => {
    const { rootSequelize, models } = await rootDB();

    try {
        // step 1 run all pending migrations
        const migrator = getRootMigrator(rootSequelize);
        const pending = await migrator.pending();

        if (pending.length > 0) {
            console.log(`👑 🔄 Running ${pending.length} pending migration(s)...`);
            await migrator.up();
            console.log("👑 ✅ Migrations completed.");
        } else {
            console.log("👑 ✅ Root DB schema is up to date.");
        }

        // step 2 seeding
        const recordCount = await models.Role.count();
        if (recordCount.length === 0) {
            console.log("👑 💾 Start data seeding...");
            await dataSeederRoot(models);
            console.log("👑 ✅ Data seeded Successfully.");
        } else {
            console.log("👑 🛠️  Data already seeded. Skipping...");
        }

        console.log('Connection has been established successfully.');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};


export default connectRootDB;