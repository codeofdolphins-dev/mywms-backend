import dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from "sequelize";
import pg from "pg";
import { LRUCache } from "lru-cache";
import { defineRootModels, defineTenantModels } from "../models/index.model.js";

import { defineRootAssociations, defineTenantAssociations } from "../models/association.js";
import { permissions, roles } from '../../public/dataset.js';

let rootCache = null;

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

    if (rootCache) {
        console.log("👑 💾 connection catched...");
        return rootCache;
    }

    // ############### local mysql ###############
    // const rootSequelize = new Sequelize("mywms", "root", "", {
    //     host: "localhost",
    //     dialect: "mysql",
    //     logging: console.log,
    // });

    // ############### local postgresql ###############
    // const rootSequelize = new Sequelize("mywms", "postgres", "1", {
    //     host: "localhost",
    //     port: 5432,
    //     dialect: "postgres",
    //     logging: console.log,
    // });

    // ############### cloud postgresql ###############
    const rootSequelize = new Sequelize("mywms", process.env.PG_DB_USER, process.env.PG_DB_PASSWORD, {
        host: process.env.PG_DB_HOST,
        port: process.env.PG_DB_PORT,
        dialect: "postgres",
        logging: console.log,
    });


    const models = defineRootModels(rootSequelize);
    defineRootAssociations(models);
    

    rootCache = { rootSequelize, models };

    return rootCache;
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
            database: "mywms"
        });
        // const client = new pg.Client({
        //     user: "postgres",
        //     password: "1",
        //     host: "localhost",
        //     port: 5432,
        //     database: "mywms"
        // });
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
        await models.Permission.bulkCreate(permissions);
        await models.Role.bulkCreate(roles);
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
    defineTenantAssociations(models);

    // 5. Save in cache
    const tenant = { sequelize, models };
    tenantCache.set(dbName, tenant);

    return tenant;
}

// ----------------------
// 🔻 Delete Tenant Database
// ----------------------
export async function deleteTenantDatabase(dbName) {
    if (!dbName) throw new Error("Tenant database name is required!!!");

    try {
        const client = new pg.Client({
            user: process.env.PG_DB_USER,
            password: process.env.PG_DB_PASSWORD,
            host: process.env.PG_DB_HOST,
            port: process.env.PG_DB_PORT,
            database: "mywms", // connect to root DB
        });

        await client.connect();

        // Check if DB exists
        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname='${dbName}'`
        );

        if (result.rowCount === 0) {
            await client.end();
            throw new Error(`⚠️ Database "${dbName}" does not exist.`);
        }

        console.log(`🛑 Terminating active connections to "${dbName}"...`);
        await client.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${dbName}' AND pid <> pg_backend_pid();
        `);

        console.log(`🗑️  Dropping database: ${dbName}`);
        await client.query(`DROP DATABASE "${dbName}"`);

        await client.end();

        // Clean up the cache if the DB was cached
        if (tenantCache.has(dbName)) {
            const tenant = tenantCache.get(dbName);
            await tenant?.sequelize?.close();
            tenantCache.delete(dbName);
            console.log(`🧹 Removed "${dbName}" from cache`);
        }

        console.log(`✅ Successfully deleted database: ${dbName}`);
    } catch (error) {
        console.error(`❌ Error deleting database "${dbName}"`, error);
        throw error;
    }
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
