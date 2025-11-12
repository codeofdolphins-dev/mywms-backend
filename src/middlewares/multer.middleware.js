import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let desticationLocation = './public/user';

    const folderName = req.headers['x-tenant-id'];
    if(folderName){
      desticationLocation = path.join(process.cwd(), "public", "user", folderName);
      fs.mkdirSync(desticationLocation, { recursive: true });
      req.isfileSave = true;
    }else req.isfileSave = false;
    
    cb(null, desticationLocation)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

export const upload = multer({ storage });