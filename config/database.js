import dotenv from "dotenv";
dotenv.config();

export const rootDBConfig = {
  database: "mywms",
  username: process.env.PG_DB_USER,
  password: process.env.PG_DB_PASSWORD,
  host: process.env.PG_DB_HOST,
  port: process.env.PG_DB_PORT,
  dialect: "postgres",
};

export function tenantDBConfig(dbName) {
  return {
    database: dbName,
    username: process.env.PG_DB_USER,
    password: process.env.PG_DB_PASSWORD,
    host: process.env.PG_DB_HOST,
    port: process.env.PG_DB_PORT,
    dialect: "postgres",
  };
}
