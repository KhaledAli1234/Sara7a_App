import { Router } from "express";
import * as imageService from "./image.service.js";

const router = Router();

router.get("/", imageService.image);
export default router;
