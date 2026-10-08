import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import * as controller from "../controllers/hero-banners.controller.js";

export const heroBannersRouter = Router();

heroBannersRouter.get("/", asyncHandler(controller.list));
