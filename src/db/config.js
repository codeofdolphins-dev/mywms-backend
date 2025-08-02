import dotenv from 'dotenv';
dotenv.config();
import { Sequelize } from "sequelize";
import session from 'express-session';
import expressMysqlSession from "express-mysql-session";


const MySQLStore = expressMysqlSession(session);


// cloud************************************
// const db_obj = new Sequelize(process.env.DATABASE_NAME, process.env.USER, process.env.PASSWORD, {
//     host: process.env.HOST,
//     port: process.env.MYSQL_DB_PORT,
//     dialect: 'mysql'
// });


// cloud########################################
// const session_store = new MySQLStore({
//     host: process.env.HOST,
//     user: process.env.USER,
//     password: process.env.PASSWORD,
//     database: process.env.DATABASE_NAME,
//     port: process.env.MYSQL_DB_PORT
// })


// // local***********************************
const db_obj = new Sequelize("mywms", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: 'mysql'
});


// // local#######################################
const session_store =  new MySQLStore({
  host: "localhost",
  user: "root",
  password: "",
  database: "mywms",
  port: 3306
})

export { db_obj, session_store };