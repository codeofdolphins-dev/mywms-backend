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

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/image', express.static(path.join(process.cwd(), 'public', 'user')));

app.get("/", (_, res) => {
  return res.send("Response from Backend!")
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

app.use("/api", apiRoutes);

export { app }