import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import * as controller from "../controllers/search.controller.js";

export const searchRouter = Router();

searchRouter.get("/", asyncHandler(controller.search));
searchRouter.get("/suggestions", asyncHandler(controller.suggestions));
