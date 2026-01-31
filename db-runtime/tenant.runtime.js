import { Sequelize } from "sequelize";
import { tenantDBConfig } from "../config/database.js";
import { defineTenantModels } from "../src/models/index.model.js";
import { defineTenantAssociations } from "../src/models/association.js";

export async function connectTenantDB(dbName) {
  const sequelize = new Sequelize(tenantDBConfig(dbName));
  await sequelize.authenticate();

  const models = defineTenantModels(sequelize);
  defineTenantAssociations(models);

  return { sequelize, models };
}
