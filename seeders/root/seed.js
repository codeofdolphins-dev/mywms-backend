import { dataSeederRoot } from "../../src/helper/seeder.js";

export async function seedRoot(models) {
  const count = await models.Role.count();
  if (count === 0) {
    console.log("👑 🌱 Seeding root DB...");
    await dataSeederRoot(models);
  }
}
