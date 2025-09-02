// import { db_obj } from "./config.js";
import "../models/Association.js"
import { rootDB } from "./tenantMenager.service.js";


// const connectDB = async () => {
//     try {
//         await db_obj.authenticate();
//         // await db_obj.sync({ force: true });
//         console.log('Connection has been established successfully.');

//     } catch (error) {
//         console.error('Unable to connect to the database:', error);
//         throw error;
        
//     }
// }

const connectRootDB = async () => {
    try {
        await rootDB();
        // await db_obj.sync({ force: true });
        console.log('Connection has been established successfully.');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
        
    }
}

export default connectRootDB;