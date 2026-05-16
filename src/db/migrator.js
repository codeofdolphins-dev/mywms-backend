import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates an Umzug migrator for the ROOT database ("mywms")
 * Points to: src/migrations/root/*.js
 */
export function getRootMigrator(sequelize) {
    return new Umzug({
        migrations: {
            glob: path.join(__dirname, '../migrations/root/*.js').replace(/\\/g, '/'),
        },
        context: sequelize.getQueryInterface(),
        storage: new SequelizeStorage({ sequelize }),
        logger: console,
    });
}

/**
 * Creates an Umzug migrator for any TENANT database
 * Points to: src/migrations/tenant/*.js
 */
export function getTenantMigrator(sequelize) {
    return new Umzug({
        migrations: {
            glob: path.join(__dirname, '../migrations/tenant/*.js').replace(/\\/g, '/'),
        },
        context: sequelize.getQueryInterface(),
        storage: new SequelizeStorage({ sequelize }),
        logger: console,
    });
}
