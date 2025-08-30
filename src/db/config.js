import dotenv from 'dotenv';
dotenv.config();
import { Sequelize } from "sequelize";



// local MYSQL *********************************************
// const db_obj = new Sequelize('mywms', 'root', '', {
//   host: 'localhost',
//   dialect: 'mysql',
//   logging: true
// });

// local POSTGRESQL*********************************************
const db_obj = new Sequelize(process.env.PG_DB_NAME, process.env.PG_DB_USER, process.env.PG_DB_PASSWORD, {
  host: process.env.PG_DB_HOST,
  port: process.env.PG_DB_PORT,
  dialect: "postgres",
  logging: true
});


export { db_obj };