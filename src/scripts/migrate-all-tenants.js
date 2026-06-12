import dotenv from 'dotenv';
dotenv.config();

import { rootDB, getTenantConnection } from '../db/tenantMenager.service.js';
import { getRootMigrator, getTenantMigrator } from '../db/migrator.js';
import { Op } from 'sequelize';

async function migrateAll() {
    console.log('🚀 Starting migration for all databases...\n');

    // 1. Migrate root DB
    const { rootSequelize, models } = await rootDB();
    const rootMigrator = getRootMigrator(rootSequelize);
    const rootPending = await rootMigrator.pending();
    if (rootPending.length > 0) {
        console.log(`👑 Running ${rootPending.length} root migration(s)...`);
        await rootMigrator.up();
    }
    console.log('👑 ✅ Root DB migrated\n');

    // 2. Get all tenant names
    const tenants = await models.TenantsName.findAll({
        where: { tenant: { [Op.ne]: "mywms" } }
    });
    console.log(`📦 Found ${tenants.length} tenant(s)\n`);

    // 3. Migrate each tenant
    for (const t of tenants) {
        const dbName = t.tenant;
        try {
            const { sequelize } = await getTenantConnection(dbName);
            const migrator = getTenantMigrator(sequelize);
            const pending = await migrator.pending();

            if (pending.length > 0) {
                console.log(`  🔄 ${dbName}: running ${pending.length} migration(s)...`);
                await migrator.up();
            }
            console.log(`  ✅ ${dbName}: up to date`);
        } catch (err) {
            console.error(`  ❌ ${dbName}: FAILED — ${err.message}`);
        }
    }

    console.log('\n🏁 All migrations complete.');
    process.exit(0);
}

migrateAll().catch(err => {
    console.error('Migration script failed:', err);
    process.exit(1);
});
