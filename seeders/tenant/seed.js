import { dataSeederTenant } from "../../src/helper/seeder.js";

export async function seedTenant(models) {
  console.log("👷 🌱 Seeding tenant DB...");
  await dataSeederTenant(models);
}
