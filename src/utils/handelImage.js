import path from "path";
import { fileURLToPath } from "url"
import fs, { promises as pfs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
* Convert base64 string to image file
* @param {string} base64String - The base64-encoded image string (with or without the data URL prefix)
* @param {string} folderName - folder name
*/
async function saveBase64Image(base64String, folderName) {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const imageBuffer = Buffer.from(matches ? matches[2] : base64String, "base64");

    const absoluteDir = path.join(process.cwd(), "public", "user", folderName);
    await pfs.mkdir(absoluteDir, { recursive: true });

    const sizeInKB = imageBuffer.length / 1024;
    if (sizeInKB >= 5120) throw new Error("image size must be less than 5MB!!!");

    const extname = matches ? matches[1].split("/")[1] : undefined;
    if (extname === undefined) throw new Error("Data URL prefix not available!!!");

    const fileName = `${Date.now()}.${extname}`

    await pfs.writeFile(`${absoluteDir}/${fileName}`, imageBuffer);
    console.log(`✅ Image saved at: ${imgPath}`);

    return fileName;
}


/**
* @param {string} filename - image file name
* @param {string} folderName - folder name
*/
async function deleteImage(filename, folderName = "") {
    let imgPath = null;

    if(folderName) imgPath = path.join(process.cwd(), "public", "user", folderName, filename); 
    else imgPath = path.join(process.cwd(), "public", "user", filename); 

    if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
        console.log("File Deleted.");
        return true;
    };
    console.log("File Not Deleted!!!");
    return false;
}

/**
 * 
 * @param {string} fileName - file name
 * @param {string} folderName folder name
 * @returns boolean
 */
async function moveFile(fileName, folderName) {
    try {
        const sourceLocation = path.join(process.cwd(), "public", "user", fileName);
        const destinationLocation = path.join(process.cwd(), "public", "user", folderName);
        
        pfs.mkdir(destinationLocation, { recursive: true });
        pfs.rename(sourceLocation, `${destinationLocation}/${fileName}`, (err) => {
            if(err){
                console.log("error Moving file: ", err);
                return false;            
            }
        });
        console.log("File moved.");
        return true;
    } catch (error) {
        throw error;
    }
}

export { saveBase64Image, deleteImage, moveFile };