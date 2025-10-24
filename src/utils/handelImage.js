import path from "path";
import { fileURLToPath } from "url"
import fs, { promises as pfs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
* Convert base64 string to image file
* @param {string} base64String - The base64-encoded image string (with or without the data URL prefix)
*/
async function saveBase64Image(base64String) {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const imageBuffer = Buffer.from(matches ? matches[2] : base64String, "base64");

    const absoluteDir = path.resolve(__dirname, "../../public/user");
    await pfs.mkdir(absoluteDir, { recursive: true });

    const sizeInKB = imageBuffer.length / 1024;
    if (sizeInKB >= 5120) throw new Error("image size must be less than 5MB!!!");

    const extname = matches ? matches[1].split("/")[1] : undefined;
    if (extname === undefined) throw new Error("Data URL prefix not available!!!");

    const fileName = `${Date.now()}.${extname}`
    const imgPath = path.join(absoluteDir, fileName);

    await pfs.writeFile(imgPath, imageBuffer);
    console.log(`✅ Image saved at: ${imgPath}`);

    return fileName;
}


/**
* @param {string} filename - image file name
*/
async function deleteImage(filename) {
    const absoluteDir = path.resolve(__dirname, "../../public/user");

    const imgPath = path.join(absoluteDir, filename);

    if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);

        return true;
    }
    return false;
}

export { saveBase64Image, deleteImage };