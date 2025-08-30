import sharp from "sharp";
import path from "path";
import fs from "fs";

export const resizeImage = async (filePath, sizes = [300, 600, 900]) => {
  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);
  const dir = path.dirname(filePath);

  const promises = sizes.map(async size => {
    const outputPath = path.join(dir, `${name}-${size}${ext}`);
    await sharp(filePath).resize(size).toFile(outputPath);
    return outputPath;
  });

  return Promise.all(promises);
};
