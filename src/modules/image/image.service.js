import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const image = (req, res , next) => {
  const { name } = req.params;
  const { size } = req.query;

  const ext = path.extname(name);
  const base = path.basename(name, ext);

  const fileName = size ? `${base}-${size}${ext}` : name;
  const imagePath = path.resolve(__dirname, "./src/uploads", fileName);

  if (!fs.existsSync(imagePath)) {
    return next(new Error("Image not found" , {cause:404}))
  }

  res.sendFile(imagePath);
};
