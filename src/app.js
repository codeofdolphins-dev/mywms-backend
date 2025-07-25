import express from "express";
import "./db/config.js";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import { session_store } from "./db/config.js";

const app = express();

// Utilities to handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/pages"));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));


// setup session
app.use(session({
  secret: process.env.SECRETKEY || "dfsdfsdf515134rdsf",
  store: session_store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // ✅ true only if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));


import webRoutes from "./routes/index.route.js"

app.use("/", webRoutes);

export { app }