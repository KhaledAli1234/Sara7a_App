import multer from "multer";

export const fileValidation = {
  image: ["image/jpeg", "image/gif", "image/jpg", "image/png"],
  document: ["application/pdf", "application/msword"],
};

export const cloudFileUpload = ({ validation = [] } = {}) => {
  const storage = multer.diskStorage({});

  const fileFilter = function (req, file, callback) {
    if (validation.includes(file.mimetype)) {
      return callback(null, true);
    }
    return callback("invalid file format", false);
  };

  return multer({ fileFilter, storage });
};
