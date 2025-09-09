import dotenv from 'dotenv';
dotenv.config();
// import "./db/config.js";
import { app } from './app.js';
import connectRootDB from './db/connection.js';

connectRootDB()
.then(() => {
    const port = process.env.PORT || 4000;
    
    app.listen(port, () => {
        console.log(`app is running on port: ${port}`);
        
    })
})
.catch(err => {
    console.log("DB connection error: ", err);
});