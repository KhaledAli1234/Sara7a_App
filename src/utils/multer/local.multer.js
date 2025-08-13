import path from "node:path";
import fs from "node:fs";
import multer from "multer";

export const fileValidation = {
  image: ["image/jpeg", "image/gif", "image/jpg", "image/png"],
  document: ["application/pdf", "application/msword"],
};

export const localFileUpload = ({
  customPath = "general",
  validation = [],
} = {}) => {
  const storage = multer.diskStorage({
    destination: function (req, file, callback) {
     
      let basePath = `uploads/${customPath}`;

       if (req.user?._id) {
        basePath += `/${req.user._id}`;
      }

      const fullPath = path.resolve(`./src/${basePath}`);

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }

      req.basePath = basePath

      callback(null, path.resolve(fullPath));
    },

    filename: function (req, file, callback) {
      const uniqueFileName = Date.now() + "__" + Math.random() + "__" + file.originalname;

      file.finalPath = req.basePath + "/" + uniqueFileName;

      callback(null, uniqueFileName);
    },
  });

  const fileFilter = function (req, file, callback) {
     
    if (validation.includes(file.mimetype)) {
      return callback(null, true);
    }

    return callback("invalid file format", false);
  };

  return multer({
    fileFilter,
    storage,
  });
};
