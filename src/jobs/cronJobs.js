import { TokenModel } from "../DB/models/Token.model.js";
import { asyncHandler } from "../utils/response.js";
import cron from "node-cron";
import * as DBservice from "../../DB/db.service.js";


export const cleanupJob = () => {
  cron.schedule(
    "0 * * * *",
    asyncHandler(async () => {
    
      const result = await DBservice.deleteMany({
          model: TokenModel,
          filter: {
            expiresAt: { $lt: new Date() },
          },
        });
      console.log(`expired tokens`);
    })
  );
};