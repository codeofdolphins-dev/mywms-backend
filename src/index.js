import dotenv from 'dotenv';
dotenv.config();
// import "./db/config.js";
import { app } from './app.js';
import connectRootDB from './db/connection.js';
import { initSchedule } from './jobs/index.js';

connectRootDB()
    .then(() => {
        const port = process.env.PORT || 4000;

        app.listen(port, () => {
            console.log(`app is running on port: ${port}`);

            /** setup Cron Jobs */
            console.log("setup Cron Jobs...");
            initSchedule();

        })
    })
    .catch(err => {
        console.log("DB connection error: ", err);
    });


// import dotenv from "dotenv";
// dotenv.config();

// import { app } from "./app.js";

// // ✅ correct relative paths (go OUT of src)
// import { bootstrapRootDB } from "../db-runtime/root.runtime.js";
// import { seedRoot } from "../seeders/root/seed.js";

// async function startServer() {
//     try {
//         // 1️⃣ Root DB: migrate + connect
//         const { models } = await bootstrapRootDB();

//         // 2️⃣ Root DB seed (safe)
//         await seedRoot(models);

//         // 3️⃣ Start server
//         const port = process.env.PORT || 4000;
//         app.listen(port, () => {
//             console.log(`🚀 App is running on port: ${port}`);
//         });

//     } catch (error) {
//         console.error("❌ Startup failed:", error);
//         process.exit(1);
//     }
// }

// startServer();