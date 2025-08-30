import path from "node:path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join("./src/config/.env.prod") });
// dotenv.config({ });
import express from "express";
import userController from "./modules/user/user.controller.js";
import authController from "./modules/auth/auth.controller.js";
import messageController from "./modules/message/message.controller.js";
import connectDB from "./DB/connection.db.js";
import { fileURLToPath } from "url";
import { globalErrorHandling } from "./utils/response.js";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet"; 
import chalk from "chalk";
import { rateLimit } from "express-rate-limit";
import { resizeImage } from "./utils/image/imageResizer.js";
// import { cleanupJob } from "./jobs/cronJobs.js";


async function bootstrab() {
  const app = express();
  const port = process.env.PORT || 5000;

  // const whitelist = process.env.ORIGINS.split(",")
  // var corsOptions = {
  //   origin: function (origin, callback) {
  //     if (whitelist.indexOf(origin) !== -1) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error("Not allowed by CORS"));
  //     }
  //   },
  // };
  // app.use(cors(corsOptions));
  
  const limiter = rateLimit({
    windowMs:  60 * 60 * 1000,
    limit: 20000,
    standardHeaders: "draft-8",
  });

  app.use(cors());
  app.use(helmet());
  app.use("/auth",limiter); 
  app.use(morgan("dev"));

  await connectDB();

  app.use(express.json());

  app.use("/uploads", express.static(path.resolve("./src/uploads")));

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  app.use("/user", userController);
  app.use("/auth", authController);
  app.use("/message", messageController);

  app.get("/", (req, res) => {
    res.json({ message: " welcome to blog app " });
  });

  app.all("{/*dummy}", (req, res) => {
    res.json({ message: " invalid routing " });
  });
  app.use(globalErrorHandling);
  // cleanupJob()

  return app.listen(port, () => {
    console.log(`server is running in port ${port} 🚀`);
  });
}
export default bootstrab;
