import { appendFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

export const logWritter = (pathArg = "", content = "") => {
    if (!pathArg) throw new Error("Please provide a valid path for the log file.");

    const logPath = path.isAbsolute(pathArg) ? pathArg : path.resolve(projectRoot, pathArg);
    const formattedContent = content.endsWith("\n") ? content : `${content}\n`;

    try {
        appendFileSync(logPath, formattedContent, "utf-8");
    } catch (error) {
        console.error(`Error writing to log file at ${logPath}:`, error);
    }
};