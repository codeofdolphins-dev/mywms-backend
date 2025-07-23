import { db_obj } from "./config.js";
import "../models/association.js"


const connectDB = async () => {
    try {
        await db_obj.authenticate();
        // await db_obj.sync({ force: true });
        console.log('Connection has been established successfully.');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw new Error(error);
        
    }
}

export default connectDB;