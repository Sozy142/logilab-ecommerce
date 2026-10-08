import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import * as controller from "../controllers/categories.controller.js";

export const categoriesRouter = Router();

categoriesRouter.get("/tree", asyncHandler(controller.getTree));
categoriesRouter.get("/dev-board-brands", asyncHandler(controller.getDevBoardBrands));
categoriesRouter.get("/:slug", asyncHandler(controller.getBySlug));
