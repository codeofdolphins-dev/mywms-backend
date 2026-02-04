import dotenv from "dotenv";
dotenv.config();

export default {
  development: {
    username: process.env.PG_DB_USER,
    password: process.env.PG_DB_PASSWORD,
    database: "test",
    host: process.env.PG_DB_HOST,
    port: process.env.PG_DB_PORT,
    dialect: "postgres",
  },
};
