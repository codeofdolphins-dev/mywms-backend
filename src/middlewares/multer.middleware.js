import multer from "multer";
import path from "path";
import fs from "fs";


// ==========================================
// 1. DISK STORAGE (For permanent files)
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let desticationLocation = './public/user';

        const folderName = req.headers['x-tenant-id'];
        if (folderName) {
            desticationLocation = path.join(process.cwd(), "public", "user", folderName);
            fs.mkdirSync(desticationLocation, { recursive: true });
            req.isfileSave = true;
        } else req.isfileSave = false;

        cb(null, desticationLocation)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

export const upload = multer({ storage });


// ==========================================
// 2. MEMORY STORAGE (For temp data parsing)
// ==========================================
const memoryStorage = multer.memoryStorage();
export const uploadMemory = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 1024 * 1024 * 10  // 10MB
    }
});