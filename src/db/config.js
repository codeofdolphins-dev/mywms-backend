import dotenv from 'dotenv';
dotenv.config();
import { Sequelize } from "sequelize";

// const db_obj = new Sequelize(process.env.DATABASE_NAME, process.env.USER, process.env.PASSWORD, {
//   host: process.env.HOST,
//   port: process.env.MYSQL_DB_PORT,
//   dialect: 'mysql'
// });

const db_obj = new Sequelize("mywms", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: 'mysql'
});

export { db_obj };