import { Sequelize } from "sequelize";
import { rootDBConfig } from "../config/database.js";
import { defineRootModels } from "../src/models/index.model.js";
import { defineRootAssociations } from "../src/models/association.js";
import { Umzug, SequelizeStorage } from "umzug";
import path from "path";

export async function bootstrapRootDB() {
  const sequelize = new Sequelize(rootDBConfig);
  await sequelize.authenticate();

  const models = defineRootModels(sequelize);
  defineRootAssociations(models);

  const migrator = new Umzug({
    migrations: {
      glob: path.join(process.cwd(), "migrations/root/*.js"),
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });

  await migrator.up();

  return { sequelize, models };
}
