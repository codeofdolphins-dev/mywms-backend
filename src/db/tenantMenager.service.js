import dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from "sequelize";
import pg from "pg";
import { LRUCache } from "lru-cache";
import { defineRootModels, defineTenantModels } from "../models/index.model.js";
import dataSeeder from "../helper/seeder.js";
import defineAssociations from "../models/association.js"


// ----------------------
// 🔹 LRU Cache Setup
// ----------------------
const tenantCache = new LRUCache({
    max: 100,                 // keep max 100 tenants
    ttl: 1000 * 60 * 10,      // 10 minutes TTL
    dispose: async (value, key) => {
        console.log(`⏳ Closing tenant connection: ${key}`);
        try {
            await value.sequelize.close();
        } catch (err) {
            console.error(`Error closing connection for ${key}`, err);
        }
    }
});


// ----------------------
// 🔹 Root Database
// ----------------------
export async function rootDB() {
    const rootSequelize = new Sequelize("mywms", process.env.PG_DB_USER, process.env.PG_DB_PASSWORD, {
        host: process.env.PG_DB_HOST,
        port: process.env.PG_DB_PORT,
        dialect: "postgres",
        logging: console.log,
    });

    const models = defineRootModels(rootSequelize);
    defineAssociations(models);
    // await rootSequelize.sync({ force: true });


    const recordCount = await models.Role.count();

    if (recordCount === 0) {
        console.log("👑 💾 Start data seeding...");
        await dataSeeder(models);
        console.log("👑 ✅ Data seeded Successfully.");
    } else {
        console.log("👑 🛠️  Data already seeded. Skipping...");
    }

    const root = { rootSequelize, models };

    return root;
}


// ----------------------
// 🔹 Create Tenant DB
// ----------------------
export async function generateDatabase(dbName) {
    try {
        const client = new pg.Client({
            user: process.env.PG_DB_USER,
            password: process.env.PG_DB_PASSWORD,
            host: process.env.PG_DB_HOST,
            port: process.env.PG_DB_PORT,
            database: "mywms",
            
        });
        await client.connect();

        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname='${dbName}'`
        );

        if (result.rowCount === 0) {
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`👷 ✅ Created database: ${dbName}`);
        }
        await client.end();

        const { sequelize, models } = await getTenantConnection(dbName);

        await sequelize.sync();
        console.log("👷 💾 Start data seeding...");
        await dataSeeder(models);
        console.log("👷 ✅ Data seeded Successfully.");

    } catch (error) {
        console.log("👷 ❌ error from service:");
        throw error;
    }
}


// ----------------------
// 🔹 Get Tenant Connection (with LRU cache)
// ----------------------
export async function getTenantConnection(dbName) {
    if (!dbName) throw new Error("Tenant db name is required!!!");

    // 1. Check cache
    if (tenantCache.has(dbName)) {
        return tenantCache.get(dbName);
    }

    // 2. Verify DB exists
    const isDBExist = await checkDBExists(dbName);
    if (!isDBExist) throw new Error(`Database ${dbName} does not exist!!!!`);

    // 3. Create Sequelize instance
    const sequelize = new Sequelize(
        dbName,
        process.env.PG_DB_USER,
        process.env.PG_DB_PASSWORD,
        {
            host: process.env.PG_DB_HOST,
            port: process.env.PG_DB_PORT,
            dialect: "postgres",
            pool: { min: 1, max: 5 },
            logging: console.log,
        }
    );

    // 4. Define models + associations
    const models = defineTenantModels(sequelize);
    defineAssociations(models);

    // 5. Save in cache
    const tenant = { sequelize, models };
    tenantCache.set(dbName, tenant);

    return tenant;
}


// ----------------------
// 🔹 Helper: check if DB exists
// ----------------------
const checkDBExists = async (dbname) => {
    try {
        const client = new pg.Client({
            user: process.env.PG_DB_USER,
            password: process.env.PG_DB_PASSWORD,
            host: process.env.PG_DB_HOST,
            port: process.env.PG_DB_PORT,
            database: "mywms",
        });
        await client.connect();

        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname='${dbname}'`
        );

        await client.end();
        return result.rowCount !== 0;

    } catch (error) {
        console.log("error from db helper method from service!!!");
        throw error;
    }
};
