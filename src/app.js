import dotenv from 'dotenv';
dotenv.config();
import express from "express";
// import "./db/config.js";
import session from "express-session";
import cookieParser from 'cookie-parser';
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Utilities to handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/pages"));


// const allowedOrigins = process.env.CORS_ORIGIN
//   .split(",")
//   .map(o => o.trim());
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("CORS not allowed"));
//     }
//   },
//   credentials: true
// }));

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: false
}));


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/image', express.static(path.join(process.cwd(), 'public', 'user')));

app.get("/test", (_, res) => {
    return res.send("Response from MYWMS Backend!")
})


// setup session
app.use(session({
    secret: process.env.SESSION_SECRET || "dfsdfsdf515134rdsf",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false, // ✅ true only if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

import apiRoutes from "./routes/index.route.js";
import renderPage from './utils/renderPage.js';
import { data } from './sample.js';

app.use("/api", apiRoutes);

app.use("/hash", async (req, res) => {
    // console.log(req.query); return
    const bcrypt = await import('bcrypt');
    const myPlaintextPassword = req.query?.w || "admin123";
    bcrypt.hash(myPlaintextPassword, parseInt(process.env.SALTROUNDS, 10) || 10, function (err, hash) {
        res.send({ hash });
    });
});

app.get("/preview", async (req, res) => {
    
    const html = await renderPage("requisition", data);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
})


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});


export { app }