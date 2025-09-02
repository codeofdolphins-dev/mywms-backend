import dotenv from 'dotenv';
dotenv.config();
// import "./db/config.js";
import { app } from './app.js';
import connectRootDB from './db/connection.js';

connectRootDB()
.then(() => {
    const port = process.env.PORT || 4001;
    
    app.listen(port, () => {
        console.log(`app is running on http://localhost:${port}`);
        
    })
})
.catch(err => {
    console.log("DB connection error: ", err);
});