import { Sequelize } from "sequelize";
import { tenantDBConfig } from "../config/database.js";
import { Umzug, SequelizeStorage } from "umzug";
import path from "path";

export async function migrateTenantDB(dbName) {
  const sequelize = new Sequelize(tenantDBConfig(dbName));
  await sequelize.authenticate();

  const migrator = new Umzug({
    migrations: {
      glob: path.join(process.cwd(), "migrations/tenant/*.js"),
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });

  await migrator.up();
  await sequelize.close();
}
